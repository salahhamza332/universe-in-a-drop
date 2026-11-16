// Entry point for "THE UNIVERSE INSIDE A DROP".
// entry.png is committed to this repository as the finished, reviewed artwork,
// so whatever bytes land in the output directory are exactly those reviewed
// bytes — no resampling, no re-encoding, no network. Node stdlib only.
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
