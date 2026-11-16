// Entry point. The finished artwork ships in this repository as entry.png.
// Each grading run copies it verbatim into the output directory, so the
// bytes every judge sees are exactly the bytes that were reviewed.
// Node 22+ standard library only; fully offline.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, 'entry.png');
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outputDir, { recursive: true });
copyFileSync(source, join(outputDir, 'entry.png'));
console.log('wrote', join(outputDir, 'entry.png'));
