// Moonlit Vault — movement and collision.
// Actors are circles; walls and cover are rectangles. Movement slides along
// whatever it hits, so a thief can hug a display case around a corner.

export const ACTOR_RADIUS = 13;

export function solidRects(level) {
  return level.walls.concat(level.tallCover, level.lowCover);
}

export function circleHitsRect(x, y, radius, r) {
  const nx = Math.max(r.x, Math.min(x, r.x + r.w));
  const ny = Math.max(r.y, Math.min(y, r.y + r.h));
  const dx = x - nx;
  const dy = y - ny;
  return dx * dx + dy * dy < radius * radius;
}

export function collides(x, y, radius, level) {
  for (const r of solidRects(level)) {
    if (circleHitsRect(x, y, radius, r)) return true;
  }
  return false;
}

// Move a circle by (dx, dy), axis by axis so it slides along obstacles.
export function moveCircle(actor, dx, dy, level) {
  const nx = actor.x + dx;
  if (!collides(nx, actor.y, ACTOR_RADIUS, level)) actor.x = nx;
  const ny = actor.y + dy;
  if (!collides(actor.x, ny, ACTOR_RADIUS, level)) actor.y = ny;
}
