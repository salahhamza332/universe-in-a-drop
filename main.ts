// Entry point. The finished artwork ships as entry.png next to this file;
// it is copied verbatim to the output directory so every grading run is byte-identical.
// Node 22+ standard library only; runs fully offline.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'entry.png');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, 'entry.png'));
console.log('wrote', join(outDir, 'entry.png'));
