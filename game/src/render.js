// Moonlit Vault — drawing the museum at night.
// Flat, readable shapes: pale stone floors, deep shadow pools, glass display
// cases, and lantern cones that change colour with a guard's mood — warm
// amber while he patrols, orange when suspicious, red on the alarm. The exit
// door glows green once the gem is in the thief's bag.

import { conePolygon } from './vision.js';
import { STATE } from './guards.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './levels.js';

const CONE_STYLES = {
  [STATE.PATROL]: ['rgba(255,205,92,0.30)', 'rgba(255,205,92,0.02)'],
  [STATE.SUSPICIOUS]: ['rgba(255,146,60,0.38)', 'rgba(255,146,60,0.03)'],
  [STATE.INVESTIGATE]: ['rgba(255,146,60,0.38)', 'rgba(255,146,60,0.03)'],
  [STATE.SEARCH]: ['rgba(255,170,70,0.34)', 'rgba(255,170,70,0.02)'],
  [STATE.ALERT]: ['rgba(255,72,60,0.45)', 'rgba(255,72,60,0.04)'],
};

export function drawScene(ctx, view) {
  const { level, player, guards, time } = view;
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  drawFloor(ctx, level);
  drawShadows(ctx, level);
  drawExit(ctx, level, view.gemTaken, time);
  drawLoot(ctx, level, view.lootTaken, time);
  if (!view.gemTaken) drawGem(ctx, level, time);
  drawLowCover(ctx, level);
  drawTallCover(ctx, level);
  drawWalls(ctx, level);
  drawCones(ctx, level, guards);
  drawRipples(ctx, view.ripples);
  for (const guard of guards) drawGuard(ctx, guard, time);
  drawPlayer(ctx, player, time);
  drawVignette(ctx);
}

function drawFloor(ctx, level) {
  ctx.fillStyle = '#2b3040';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  const tile = 48;
  ctx.beginPath();
  for (let x = tile; x < WORLD_WIDTH; x += tile) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD_HEIGHT);
  }
  for (let y = tile; y < WORLD_HEIGHT; y += tile) {
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_WIDTH, y);
  }
  ctx.stroke();
  // A burgundy carpet runner down the middle of the hall.
  ctx.fillStyle = 'rgba(122,38,52,0.35)';
  ctx.fillRect(24, 276, WORLD_WIDTH - 48, 48);
}

function drawShadows(ctx, level) {
  for (const s of level.shadows) {
    ctx.fillStyle = 'rgba(5,8,18,0.55)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(120,150,255,0.10)';
    ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
  }
}

function drawExit(ctx, level, gemTaken, time) {
  const e = level.exit;
  const pulse = gemTaken ? 0.75 + Math.sin(time * 5) * 0.25 : 0.35;
  ctx.fillStyle = `rgba(46,204,138,${0.25 * pulse})`;
  ctx.fillRect(e.x - 6, e.y - 6, e.w + 12, e.h + 12);
  ctx.fillStyle = '#14532d';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#2ecc8a';
  ctx.fillRect(e.x + 4, e.y + 4, e.w - 8, e.h - 8);
  ctx.fillStyle = '#06281a';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2);
}

function drawLoot(ctx, level, lootTaken, time) {
  level.loot.forEach((coin, i) => {
    if (lootTaken.has(i)) return;
    const bob = Math.sin(time * 3 + i * 1.7) * 2;
    ctx.fillStyle = '#f5c542';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe89a';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y + bob, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawGem(ctx, level, time) {
  const { x, y } = level.gem;
  // Pedestal.
  ctx.fillStyle = '#4a4356';
  ctx.fillRect(x - 17, y - 6, 34, 22);
  ctx.fillStyle = '#655b78';
  ctx.fillRect(x - 17, y - 6, 34, 6);
  // A glow that breathes, then the gem itself, turning slowly.
  const glow = 16 + Math.sin(time * 2.4) * 4;
  const grad = ctx.createRadialGradient(x, y - 14, 2, x, y - 14, glow + 12);
  grad.addColorStop(0, 'rgba(120,220,255,0.5)');
  grad.addColorStop(1, 'rgba(120,220,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(x - glow - 14, y - glow - 28, (glow + 14) * 2, (glow + 14) * 2);
  const w = 11 + Math.sin(time * 2.4) * 1.2;
  ctx.fillStyle = '#7fdcff';
  ctx.beginPath();
  ctx.moveTo(x, y - 28);
  ctx.lineTo(x + w, y - 14);
  ctx.lineTo(x, y - 2);
  ctx.lineTo(x - w, y - 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.moveTo(x, y - 28);
  ctx.lineTo(x + w * 0.45, y - 14);
  ctx.lineTo(x - w * 0.45, y - 14);
  ctx.closePath();
  ctx.fill();
}

function drawLowCover(ctx, level) {
  for (const c of level.lowCover) {
    if (c.kind === 'crate') {
      ctx.fillStyle = '#8a6b42';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#5d472a';
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
      ctx.beginPath();
      ctx.moveTo(c.x + 3, c.y + 3);
      ctx.lineTo(c.x + c.w - 3, c.y + c.h - 3);
      ctx.moveTo(c.x + c.w - 3, c.y + 3);
      ctx.lineTo(c.x + 3, c.y + c.h - 3);
      ctx.stroke();
    } else {
      // A potted plant: a pot and a burst of leaves a thief can crouch behind.
      ctx.fillStyle = '#7a4a2b';
      ctx.fillRect(c.x + 12, c.y + 24, c.w - 24, c.h - 24);
      ctx.fillStyle = '#2e7d4f';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(c.x + c.w / 2 + Math.cos(a) * 9, c.y + 16 + Math.sin(a) * 7, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#3f9e68';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + 15, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawTallCover(ctx, level) {
  for (const c of level.tallCover) {
    if (c.kind === 'case') {
      ctx.fillStyle = '#3d3428';
      ctx.fillRect(c.x - 2, c.y - 2, c.w + 4, c.h + 4);
      ctx.fillStyle = 'rgba(170,220,255,0.30)';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(c.x + 6, c.y + c.h - 6);
      ctx.lineTo(c.x + c.w * 0.45, c.y + 4);
      ctx.lineTo(c.x + c.w * 0.62, c.y + 4);
      ctx.lineTo(c.x + 22, c.y + c.h - 6);
      ctx.closePath();
      ctx.fill();
      // The treasure inside the case.
      ctx.fillStyle = '#e8b64c';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // A marble statue on a plinth.
      ctx.fillStyle = '#575d6e';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#9aa3b8';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2 - 3, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(c.x + c.w / 2 - 4, c.y + c.h / 2 + 4, 8, 9);
    }
  }
}

function drawWalls(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = '#171a26';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#3a4157';
    if (w.w >= w.h) ctx.fillRect(w.x, w.y, w.w, 4);
    else ctx.fillRect(w.x, w.y, 4, w.h);
  }
}

function drawCones(ctx, level, guards) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const guard of guards) {
    const poly = conePolygon(guard, level);
    const [inner, outer] = CONE_STYLES[guard.state] || CONE_STYLES[STATE.PATROL];
    const grad = ctx.createRadialGradient(guard.x, guard.y, 8, guard.x, guard.y, 175);
    grad.addColorStop(0, inner);
    grad.addColorStop(1, outer);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawRipples(ctx, ripples) {
  for (const r of ripples) {
    const t = r.age / r.life;
    ctx.strokeStyle = `rgba(200,220,255,${0.35 * (1 - t)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 6 + t * r.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGuard(ctx, guard, time) {
  // Lantern glow at the guard's hand.
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.angle) * 14, guard.y + Math.sin(guard.angle) * 14, 4, 0, Math.PI * 2);
  ctx.fill();
  // Body: navy uniform, pale face, cap.
  ctx.fillStyle = '#26355e';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c39a';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#18264a';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y - 2, 7.5, Math.PI, Math.PI * 2);
  ctx.fill();
  // Awareness ring: fills amber, then red.
  if (guard.awareness > 0.02) {
    ctx.strokeStyle = guard.awareness >= 1 ? '#ff5040' : '#ffb340';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 18, -Math.PI / 2, -Math.PI / 2 + guard.awareness * Math.PI * 2);
    ctx.stroke();
  }
  // State marker.
  if (guard.state === STATE.ALERT) {
    drawMarker(ctx, guard.x, guard.y - 30 - Math.sin(time * 10) * 1.5, '!', '#ff5040');
  } else if (guard.state === STATE.SUSPICIOUS || guard.state === STATE.INVESTIGATE || guard.state === STATE.SEARCH) {
    drawMarker(ctx, guard.x, guard.y - 30, '?', '#ffb340');
  }
}

function drawMarker(ctx, x, y, text, color) {
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawPlayer(ctx, player, time) {
  ctx.save();
  if (player.inShadow) ctx.globalAlpha = 0.72;
  // Cloak: a deep teal hooded figure, lighter when sneaking low.
  ctx.fillStyle = player.sneaking ? '#0f3d3a' : '#155e57';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.sneaking ? 11.5 : 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a2a33';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9b48c';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.angle) * 2.5, player.y + Math.sin(player.angle) * 2.5, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (player.inShadow) {
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(160,190,255,0.85)';
    ctx.fillText('hidden', player.x, player.y - 22);
  }
}

function drawVignette(ctx) {
  const grad = ctx.createRadialGradient(480, 300, 320, 480, 300, 640);
  grad.addColorStop(0, 'rgba(2,4,10,0)');
  grad.addColorStop(1, 'rgba(2,4,10,0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}
