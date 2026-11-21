// Moonlit Vault — sight and lantern light.
// Guards see through a cone of lantern light. Stone walls and tall display
// cases cut the light; low crates hide only a thief who is sneaking; shadow
// pools dim the light so a thief inside them is noticed far more slowly.

export const VIEW_RANGE = 172;
export const VIEW_HALF_ANGLE = 0.64; // radians, ~37 degrees each side
export const CLOSE_RANGE = 30; // a guard always notices a thief this close

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

// Does segment a->b cross rectangle r (touching an edge counts as crossing)?
function segmentCrossesRect(ax, ay, bx, by, r) {
  if (ax >= r.x && ax <= r.x + r.w && ay >= r.y && ay <= r.y + r.h) return true;
  if (bx >= r.x && bx <= r.x + r.w && by >= r.y && by <= r.y + r.h) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [cx, cy, dx, dy] of edges) {
    if (segmentsCross(ax, ay, bx, by, cx, cy, dx, dy)) return true;
  }
  return false;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = direction(cx, cy, dx, dy, ax, ay);
  const d2 = direction(cx, cy, dx, dy, bx, by);
  const d3 = direction(ax, ay, bx, by, cx, cy);
  const d4 = direction(ax, ay, bx, by, dx, dy);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function direction(px, py, qx, qy, rx, ry) {
  return (qx - px) * (ry - py) - (qy - py) * (rx - px);
}

// Rectangles that stop lantern light completely.
export function sightBlockers(level) {
  return level.walls.concat(level.tallCover);
}

// Can a guard at g, facing gAngle, see the player right now?
// Returns 0 when unseen, otherwise a 0..1 strength (1 = point blank).
export function visionStrength(guard, player, level) {
  const dist = distance(guard.x, guard.y, player.x, player.y);
  if (dist <= CLOSE_RANGE) return 1;
  if (dist > VIEW_RANGE) return 0;
  const toPlayer = Math.atan2(player.y - guard.y, player.x - guard.x);
  if (Math.abs(angleDifference(toPlayer, guard.angle)) > VIEW_HALF_ANGLE) return 0;

  const blockers = sightBlockers(level);
  for (const r of blockers) {
    if (segmentCrossesRect(guard.x, guard.y, player.x, player.y, r)) return 0;
  }
  // Low cover hides a sneaking thief; standing tall behind a crate does not.
  if (player.sneaking) {
    for (const r of level.lowCover) {
      if (segmentCrossesRect(guard.x, guard.y, player.x, player.y, r)) return 0;
    }
  }
  let strength = 1 - (dist - CLOSE_RANGE) / (VIEW_RANGE - CLOSE_RANGE);
  if (player.inShadow) strength *= 0.32; // shadow pools dim the lantern light
  if (player.sneaking) strength *= 0.65; // a low profile is slower to register
  if (!player.moving) strength *= 0.8;
  return Math.max(0, Math.min(1, strength));
}

// The lantern cone as a polygon, clipped by walls and tall cover, for drawing.
export function conePolygon(guard, level, rays = 30) {
  const blockers = sightBlockers(level);
  const points = [[guard.x, guard.y]];
  for (let i = 0; i <= rays; i++) {
    const a = guard.angle - VIEW_HALF_ANGLE + (2 * VIEW_HALF_ANGLE * i) / rays;
    points.push(rayEnd(guard.x, guard.y, a, blockers));
  }
  return points;
}

function rayEnd(x, y, angle, blockers) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = VIEW_RANGE;
  for (const r of blockers) {
    const t = rayRectEntry(x, y, dx, dy, r);
    if (t !== null && t < best) best = t;
  }
  return [x + dx * best, y + dy * best];
}

// Entry distance of a ray into a rectangle, or null when it misses.
function rayRectEntry(x, y, dx, dy, r) {
  let tMin = 0;
  let tMax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (x < r.x || x > r.x + r.w) return null;
  } else {
    let t1 = (r.x - x) / dx;
    let t2 = (r.x + r.w - x) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
  }
  if (Math.abs(dy) < 1e-9) {
    if (y < r.y || y > r.y + r.h) return null;
  } else {
    let t1 = (r.y - y) / dy;
    let t2 = (r.y + r.h - y) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
  }
  if (tMax < tMin || tMax < 0) return null;
  return tMin;
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function pointInAnyRect(x, y, rects) {
  for (const r of rects) if (pointInRect(x, y, r)) return true;
  return false;
}
