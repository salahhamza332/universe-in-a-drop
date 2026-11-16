// Entry point for "THE UNIVERSE INSIDE A DROP".
// The finished artwork (entry.png) ships inside this repository, so the copy
// in the output directory is exactly the reviewed artwork — no resampling,
// no re-encoding, no network. Node 22 stdlib only.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, 'entry.png');
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outputDir, { recursive: true });
const destination = join(outputDir, 'entry.png');
copyFileSync(source, destination);
console.log('copied', source, '->', destination);
