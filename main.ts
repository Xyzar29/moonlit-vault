// Moonlit Vault — the hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/: index.html plus its ES modules,
// playable offline in a desktop browser with no build step and no network.
// This program delivers it: it copies game/ and screenshots/ into the output
// directory and writes dossier.json there with buildDossier from the vendored
// make.fun library, so the scorer can rebuild the same dossier from the same
// files and compare the two byte for byte.
//
// In the grader the output directory is /output; anywhere else the
// MAKEFUN_OUTPUT_DIR environment variable names it instead:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Clear only the contents of the output directory: the directory itself may
// be a mount point the grader owns, and removing it would fail the run.
mkdirSync(outputDir, { recursive: true });
for (const entry of readdirSync(outputDir)) {
  rmSync(join(outputDir, entry), { recursive: true, force: true });
}

cpSync(join(repoDir, 'game'), join(outputDir, 'game'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's own limits: at most 4 screenshots of 256 KiB,
// at most 993 entries and 48 MiB under game/, no game path over 1000 bytes,
// and the dossier's source text capped at 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
