// Moonlit Vault — the game itself.
// A top-down museum stealth game in three galleries. Steal each gallery's
// gem, gather what loot you dare, and reach the glowing exit unseen. Guards
// patrol with lanterns: stay out of the light, sneak behind the crates, wait
// in the shadow pools, and if a lantern turns orange, freeze or break away
// before it burns red.

import { LEVELS, WORLD_WIDTH, WORLD_HEIGHT } from './levels.js';
import { Guard, STATE } from './guards.js';
import { Player, NOISE_RADIUS } from './player.js';
import { createInput } from './input.js';
import { drawScene } from './render.js';
import { SoundKit } from './audio.js';
import { distance, pointInRect, visionStrength } from './vision.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = WORLD_WIDTH;
canvas.height = WORLD_HEIGHT;

const hud = {
  level: document.getElementById('hud-level'),
  objective: document.getElementById('hud-objective'),
  loot: document.getElementById('hud-loot'),
  score: document.getElementById('hud-score'),
  eye: document.getElementById('hud-eye-fill'),
  eyeWrap: document.getElementById('hud-eye'),
};
const screen = document.getElementById('screen');
const screenTitle = document.getElementById('screen-title');
const screenBody = document.getElementById('screen-body');
const screenButton = document.getElementById('screen-button');
const flash = document.getElementById('flash');

const input = createInput(canvas);
const sound = new SoundKit();

const game = {
  mode: 'title', // title | playing | caught | levelclear | complete
  levelIndex: 0,
  level: null,
  player: null,
  guards: [],
  gemTaken: false,
  lootTaken: new Set(),
  score: 0,
  levelTime: 0,
  alarmsThisLevel: 0,
  ripples: [],
  time: 0,
  modeTimer: 0,
};

function loadLevel(index) {
  game.levelIndex = index;
  game.level = LEVELS[index];
  game.player = new Player(game.level.playerStart);
  game.guards = game.level.guards.map((def) => new Guard(def));
  game.gemTaken = false;
  game.lootTaken = new Set();
  game.levelTime = 0;
  game.alarmsThisLevel = 0;
  game.ripples = [];
  hud.level.textContent = `Gallery ${index + 1} — ${game.level.name}`;
  hud.loot.textContent = `Loot 0/${game.level.loot.length}`;
  hud.score.textContent = `Score ${game.score}`;
  hud.eye.style.width = '0%';
  updateObjective();
}

function updateObjective() {
  hud.objective.textContent = game.gemTaken
    ? 'The gem is yours — reach the EXIT, unseen.'
    : game.level.brief;
}

function showScreen(title, body, button) {
  screenTitle.textContent = title;
  screenBody.innerHTML = body;
  screenButton.textContent = button;
  screen.classList.add('visible');
}

function hideScreen() {
  screen.classList.remove('visible');
}

function startGame() {
  game.score = 0;
  loadLevel(0);
  game.mode = 'playing';
  hideScreen();
}

function onCaught() {
  game.mode = 'caught';
  game.modeTimer = 1.7;
  game.score = Math.max(0, game.score - 250);
  sound.caught();
  flash.textContent = 'SPOTTED!';
  flash.classList.add('visible');
}

function onLevelClear() {
  const timeBonus = Math.max(0, 300 - Math.floor(game.levelTime) * 2);
  const ghostBonus = game.alarmsThisLevel === 0 ? 500 : 0;
  game.score += 200 + timeBonus + ghostBonus;
  sound.levelClear();
  game.mode = 'levelclear';
  const ghostLine = ghostBonus
    ? '<br>Ghost bonus: no guard ever raised the alarm. <b>+500</b>'
    : '';
  showScreen(
    `${game.level.name} — cleared`,
    `Gem stolen, thief unseen by the morning shift.<br>` +
      `Clear bonus <b>+200</b> · time bonus <b>+${timeBonus}</b>${ghostLine}`,
    game.levelIndex + 1 < LEVELS.length ? 'Next gallery' : 'Finish the night',
  );
}

function onGameComplete() {
  game.mode = 'complete';
  showScreen(
    'The night is yours',
    `All three gems are gone from the Moonlit Vault, and no guard can say how.<br>` +
      `Final score: <b>${game.score}</b>`,
    'Play again',
  );
}

screenButton.addEventListener('click', () => {
  sound.unlock();
  if (game.mode === 'title' || game.mode === 'complete') startGame();
  else if (game.mode === 'levelclear') {
    if (game.levelIndex + 1 < LEVELS.length) {
      loadLevel(game.levelIndex + 1);
      game.mode = 'playing';
      hideScreen();
    } else {
      onGameComplete();
    }
  }
});
window.addEventListener('keydown', (e) => {
  sound.unlock();
  if (e.code === 'Enter' && game.mode !== 'playing' && game.mode !== 'caught') {
    screenButton.click();
  }
  if (e.code === 'KeyM') {
    sound.muted = !sound.muted;
  }
  if (e.code === 'KeyR' && game.mode === 'playing') {
    loadLevel(game.levelIndex);
  }
});
canvas.addEventListener('pointerdown', () => sound.unlock());

function update(dt) {
  game.time += dt;
  for (const r of game.ripples) r.age += dt;
  game.ripples = game.ripples.filter((r) => r.age < r.life);
  if (game.mode === 'caught') {
    game.modeTimer -= dt;
    if (game.modeTimer <= 0) {
      flash.classList.remove('visible');
      loadLevel(game.levelIndex);
      game.mode = 'playing';
    }
    return;
  }
  if (game.mode !== 'playing') return;
  game.levelTime += dt;

  const step = game.player.update(dt, input, game.level);
  if (step === 'step') {
    sound.footstep();
    game.ripples.push({ x: game.player.x, y: game.player.y, age: 0, life: 0.55, radius: NOISE_RADIUS });
    for (const guard of game.guards) {
      if (distance(guard.x, guard.y, game.player.x, game.player.y) <= NOISE_RADIUS) {
        guard.hearNoise(game.player.x, game.player.y, game.level);
      }
    }
  }

  const events = [];
  for (const guard of game.guards) guard.update(dt, game.player, game.level, events);
  for (const ev of events) {
    if (ev === 'suspicion') sound.suspicion();
    if (ev === 'alarm') {
      sound.alarm();
      game.alarmsThisLevel += 1;
    }
    if (ev === 'caught') onCaught();
  }

  // Pickups.
  const p = game.player;
  game.level.loot.forEach((coin, i) => {
    if (!game.lootTaken.has(i) && distance(p.x, p.y, coin.x, coin.y) < 20) {
      game.lootTaken.add(i);
      game.score += 100;
      sound.coin();
    }
  });
  if (!game.gemTaken && distance(p.x, p.y, game.level.gem.x, game.level.gem.y - 12) < 24) {
    game.gemTaken = true;
    sound.gem();
    updateObjective();
  }
  if (game.gemTaken && pointInRect(p.x, p.y, game.level.exit)) {
    onLevelClear();
    return;
  }

  // HUD.
  const danger = Math.max(0, ...game.guards.map((g) => g.awareness));
  hud.eye.style.width = `${Math.round(danger * 100)}%`;
  hud.eye.style.background = danger >= 1 ? '#ff5040' : danger >= 0.4 ? '#ffb340' : '#ffd76a';
  hud.eyeWrap.classList.toggle('danger', danger >= 0.4);
  hud.loot.textContent = `Loot ${game.lootTaken.size}/${game.level.loot.length}`;
  hud.score.textContent = `Score ${game.score}`;
  sound.updateHeartbeat(dt, danger);
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.033, (now - (frame.last || now)) / 1000);
  frame.last = now;
  if (!window.__frozen) update(dt);
  drawScene(ctx, game);
}
loadLevel(0);
showScreen(
  'MOONLIT VAULT',
  'Three gems. Three galleries. One thief.<br>' +
    'Move with <b>WASD</b> or the arrow keys. Hold <b>Shift</b> to sneak — silent, and low enough to hide behind crates.<br>' +
    'Stay out of the lantern light, wait in the shadow pools, and reach the <b>EXIT</b> with the gem.',
  'Begin the heist',
);
requestAnimationFrame(frame);

// --- Screenshot scenes -----------------------------------------------------
// ?shot=<name> freezes a staged, real render of the game for the maker's
// screenshots: cover (gallery 1, a careful sneak), shadow (gallery 2, hidden
// while a guard grows suspicious), alert (gallery 3, the gem taken and the
// alarm a heartbeat away), clear (a finished gallery's clear screen).
function stageShot(name) {
  const scenes = {
    cover: () => {
      loadLevel(0);
      game.player.x = 388;
      game.player.y = 336;
      game.player.sneaking = true;
      game.player.angle = 0;
      game.guards[0].x = 560;
      game.guards[0].y = 336;
      game.guards[0].angle = Math.PI; // lantern sweeping toward the thief
      game.guards[1].x = 852;
      game.guards[1].y = 240;
      game.guards[1].angle = Math.PI / 2;
    },
    shadow: () => {
      loadLevel(1);
      game.player.x = 279;
      game.player.y = 300;
      game.player.inShadow = true;
      game.player.angle = 0;
      const g = game.guards[0];
      g.x = 430;
      g.y = 300;
      g.angle = Math.PI;
      g.state = STATE.SUSPICIOUS;
      g.awareness = 0.62;
      g.lastSeen = { x: 279, y: 300 };
      game.guards[1].x = 112;
      game.guards[1].y = 300;
      game.guards[1].angle = Math.PI / 2;
      game.guards[2].x = 848;
      game.guards[2].y = 220;
      game.guards[2].angle = -Math.PI / 2;
    },
    alert: () => {
      loadLevel(2);
      game.gemTaken = true;
      updateObjective();
      game.player.x = 800;
      game.player.y = 470;
      game.player.angle = Math.PI / 4;
      game.lootTaken = new Set([0, 2]);
      const g = game.guards[1];
      g.x = 640;
      g.y = 360;
      g.angle = Math.PI / 5;
      g.state = STATE.ALERT;
      g.awareness = 1;
      game.guards[0].x = 470;
      game.guards[0].y = 108;
      game.guards[0].angle = 0;
    },
    clear: () => {
      loadLevel(0);
      game.levelTime = 74;
      onLevelClear();
    },
  };
  if (scenes[name]) {
    scenes[name]();
    game.mode = name === 'clear' ? game.mode : 'playing';
    if (name !== 'clear') hideScreen();
    hud.loot.textContent = `Loot ${game.lootTaken.size}/${game.level.loot.length}`;
    hud.score.textContent = `Score ${game.score}`;
    drawScene(ctx, game);
    window.__frozen = true;
    window.__shotReady = true;
  }
}
const shotName = new URLSearchParams(location.search).get('shot');
if (shotName) {
  game.mode = 'playing';
  stageShot(shotName);
}

// A small handle for the maker's own play-tests: read the state, move the
// thief, and check the win and detection paths end to end.
window.__mv = {
  game,
  start: startGame,
  teleport(x, y) {
    game.player.x = x;
    game.player.y = y;
  },
  // How strongly the guards would see a sneaking thief standing at (x, y).
  sight(x, y) {
    const probe = { x, y, sneaking: true, moving: true, inShadow: false };
    return Math.max(0, ...game.guards.map((g) => visionStrength(g, probe, game.level)));
  },
};
