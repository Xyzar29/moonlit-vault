// Moonlit Vault — keyboard and mouse state.
// One plain object the rest of the game reads: held movement keys, the sneak
// modifier, and click points for the menu buttons drawn on the canvas.

export function createInput(canvas) {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    click: null, // {x, y} in world coordinates, consumed by the game
    anyKey: false,
  };

  const keyMap = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
  };

  window.addEventListener('keydown', (e) => {
    if (keyMap[e.code]) {
      input[keyMap[e.code]] = true;
      input.anyKey = true;
      e.preventDefault();
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sneak = true;
  });
  window.addEventListener('keyup', (e) => {
    if (keyMap[e.code]) input[keyMap[e.code]] = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sneak = false;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.click = {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  });
  return input;
}
