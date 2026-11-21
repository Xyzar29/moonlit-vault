// Moonlit Vault — level data.
// Each level is one museum floor seen from above: stone walls and tall display
// cases block sight, low crates hide a sneaking thief, dark shadow pools dim
// the lantern light, and every guard walks a patrol the player can learn.

export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 600;
export const WALL_THICKNESS = 24;

function borderWalls() {
  return [
    { x: 0, y: 0, w: WORLD_WIDTH, h: WALL_THICKNESS },
    { x: 0, y: WORLD_HEIGHT - WALL_THICKNESS, w: WORLD_WIDTH, h: WALL_THICKNESS },
    { x: 0, y: 0, w: WALL_THICKNESS, h: WORLD_HEIGHT },
    { x: WORLD_WIDTH - WALL_THICKNESS, y: 0, w: WALL_THICKNESS, h: WORLD_HEIGHT },
  ];
}

function level(def) {
  return { walls: borderWalls().concat(def.partitions || []), ...def, partitions: undefined };
}

export const LEVELS = [
  level({
    name: 'Gallery of Glass',
    brief: 'Steal the Moonstone and slip out the north door — unseen.',
    playerStart: { x: 66, y: 512 },
    exit: { x: 884, y: 24, w: 52, h: 44 },
    gem: { x: 480, y: 292 },
    loot: [
      { x: 118, y: 92 },
      { x: 878, y: 520 },
      { x: 480, y: 92 },
    ],
    partitions: [
      { x: 300, y: 24, w: 24, h: 250 },
      { x: 636, y: 326, w: 24, h: 250 },
      { x: 324, y: 380, w: 180, h: 24 },
    ],
    tallCover: [
      { x: 168, y: 138, w: 60, h: 38, kind: 'case' },
      { x: 420, y: 116, w: 60, h: 38, kind: 'case' },
      { x: 700, y: 168, w: 60, h: 38, kind: 'case' },
      { x: 232, y: 428, w: 60, h: 38, kind: 'statue' },
      { x: 560, y: 448, w: 60, h: 38, kind: 'case' },
      { x: 756, y: 428, w: 60, h: 38, kind: 'case' },
      { x: 420, y: 250, w: 34, h: 84, kind: 'statue' },
      { x: 506, y: 250, w: 34, h: 84, kind: 'statue' },
    ],
    lowCover: [
      { x: 112, y: 300, w: 42, h: 42, kind: 'crate' },
      { x: 806, y: 292, w: 42, h: 42, kind: 'crate' },
      { x: 470, y: 478, w: 42, h: 42, kind: 'plant' },
      { x: 96, y: 168, w: 42, h: 42, kind: 'plant' },
    ],
    shadows: [
      { x: 24, y: 452, w: 150, h: 124 },
      { x: 24, y: 24, w: 150, h: 104 },
      { x: 396, y: 500, w: 190, h: 76 },
      { x: 700, y: 60, w: 120, h: 90 },
    ],
    guards: [
      { waypoints: [[150, 336], [810, 336]], pause: 1.1, speed: 60 },
      { waypoints: [[852, 128], [852, 452]], pause: 1.5, speed: 54 },
    ],
  }),

  level({
    name: 'The Antechamber',
    brief: 'Three lanterns tonight. Take the Sun Opal from the rotunda.',
    playerStart: { x: 884, y: 512 },
    exit: { x: 24, y: 24, w: 52, h: 44 },
    gem: { x: 480, y: 300 },
    loot: [
      { x: 120, y: 520 },
      { x: 852, y: 96 },
      { x: 480, y: 520 },
      { x: 120, y: 300 },
    ],
    partitions: [
      { x: 200, y: 150, w: 24, h: 300 },
      { x: 736, y: 150, w: 24, h: 300 },
      { x: 380, y: 24, w: 200, h: 24 },
      { x: 380, y: 552, w: 200, h: 24 },
    ],
    tallCover: [
      { x: 392, y: 208, w: 60, h: 38, kind: 'case' },
      { x: 508, y: 208, w: 60, h: 38, kind: 'case' },
      { x: 392, y: 354, w: 60, h: 38, kind: 'case' },
      { x: 508, y: 354, w: 60, h: 38, kind: 'case' },
      { x: 96, y: 180, w: 60, h: 38, kind: 'statue' },
      { x: 804, y: 380, w: 60, h: 38, kind: 'statue' },
      { x: 96, y: 380, w: 60, h: 38, kind: 'case' },
      { x: 804, y: 180, w: 60, h: 38, kind: 'case' },
    ],
    lowCover: [
      { x: 300, y: 96, w: 42, h: 42, kind: 'crate' },
      { x: 618, y: 462, w: 42, h: 42, kind: 'crate' },
      { x: 300, y: 462, w: 42, h: 42, kind: 'plant' },
      { x: 618, y: 96, w: 42, h: 42, kind: 'plant' },
      { x: 459, y: 96, w: 42, h: 42, kind: 'crate' },
    ],
    shadows: [
      { x: 760, y: 452, w: 176, h: 124 },
      { x: 24, y: 452, w: 150, h: 124 },
      { x: 224, y: 240, w: 110, h: 120 },
      { x: 626, y: 240, w: 110, h: 120 },
    ],
    guards: [
      { waypoints: [[300, 300], [660, 300]], pause: 0.9, speed: 66 },
      { waypoints: [[112, 112], [112, 488]], pause: 1.3, speed: 58 },
      { waypoints: [[848, 488], [848, 112]], pause: 1.3, speed: 58 },
    ],
  }),

  level({
    name: 'The Star Sapphire Vault',
    brief: 'The last night. Four lanterns guard the Star Sapphire.',
    playerStart: { x: 66, y: 512 },
    exit: { x: 884, y: 532, w: 52, h: 44 },
    gem: { x: 480, y: 108 },
    loot: [
      { x: 480, y: 500 },
      { x: 120, y: 108 },
      { x: 852, y: 300 },
      { x: 120, y: 300 },
      { x: 852, y: 108 },
    ],
    partitions: [
      { x: 330, y: 160, w: 300, h: 24 },
      { x: 330, y: 160, w: 24, h: 180 },
      { x: 606, y: 160, w: 24, h: 180 },
      { x: 180, y: 420, w: 260, h: 24 },
      { x: 520, y: 420, w: 260, h: 24 },
    ],
    tallCover: [
      { x: 420, y: 226, w: 60, h: 38, kind: 'case' },
      { x: 480, y: 226, w: 60, h: 38, kind: 'case' },
      { x: 96, y: 220, w: 60, h: 38, kind: 'statue' },
      { x: 804, y: 220, w: 60, h: 38, kind: 'statue' },
      { x: 240, y: 500, w: 60, h: 38, kind: 'case' },
      { x: 660, y: 500, w: 60, h: 38, kind: 'case' },
      { x: 240, y: 84, w: 60, h: 38, kind: 'case' },
      { x: 660, y: 84, w: 60, h: 38, kind: 'case' },
    ],
    lowCover: [
      { x: 459, y: 330, w: 42, h: 42, kind: 'crate' },
      { x: 150, y: 470, w: 42, h: 42, kind: 'plant' },
      { x: 768, y: 470, w: 42, h: 42, kind: 'plant' },
      { x: 150, y: 140, w: 42, h: 42, kind: 'crate' },
      { x: 768, y: 140, w: 42, h: 42, kind: 'crate' },
    ],
    shadows: [
      { x: 24, y: 340, w: 130, h: 110 },
      { x: 806, y: 340, w: 130, h: 110 },
      { x: 396, y: 24, w: 168, h: 60 },
      { x: 24, y: 24, w: 120, h: 84 },
      { x: 816, y: 24, w: 120, h: 84 },
    ],
    guards: [
      { waypoints: [[400, 108], [560, 108]], pause: 0.7, speed: 70 },
      { waypoints: [[120, 360], [840, 360]], pause: 0.8, speed: 64 },
      { waypoints: [[250, 520], [250, 240]], pause: 1.0, speed: 60 },
      { waypoints: [[710, 240], [710, 520]], pause: 1.0, speed: 60 },
    ],
  }),
];
