// Moonlit Vault — the thief.
// Walk with WASD or the arrow keys. Hold Shift to sneak: slower, silent, and
// low enough to hide behind crates. Walking on stone is loud — a guard inside
// earshot of a footstep turns toward it. Shadow pools hide the thief's shape.

import { moveCircle } from './physics.js';
import { pointInAnyRect } from './vision.js';

export const WALK_SPEED = 152;
export const SNEAK_SPEED = 84;
export const NOISE_RADIUS = 96; // how far a walking footstep carries
const STEP_INTERVAL = 0.34; // seconds between footsteps at a walk

export class Player {
  constructor(start) {
    this.reset(start);
  }

  reset(start) {
    this.x = start.x;
    this.y = start.y;
    this.angle = -Math.PI / 2;
    this.moving = false;
    this.sneaking = false;
    this.inShadow = false;
    this.stepTimer = 0;
  }

  // Returns 'step' on the frames a footstep lands, otherwise null.
  update(dt, input, level) {
    const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    this.sneaking = input.sneak;
    this.moving = dx !== 0 || dy !== 0;
    this.inShadow = pointInAnyRect(this.x, this.y, level.shadows);
    if (!this.moving) {
      this.stepTimer = 0;
      return null;
    }
    const len = Math.hypot(dx, dy);
    const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
    moveCircle(this, (dx / len) * speed * dt, (dy / len) * speed * dt, level);
    this.angle = Math.atan2(dy, dx);
    if (this.sneaking) return null; // soft shoes: no footstep noise
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      this.stepTimer = STEP_INTERVAL;
      return 'step';
    }
    return null;
  }
}
