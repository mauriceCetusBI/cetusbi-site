// Removes EXIF, GPS, XMP, IPTC and text metadata from photos in place, without re-encoding.
// Usage: npm run media:strip              (every photo git would commit)
//        npm run media:strip -- a.jpg b.png (only these files)
import { readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';
import { STRIPPABLE, candidateFiles, scan } from './lib/media-metadata.mjs';

const given = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const files = given.length ? given : candidateFiles();
let changed = 0;
let skipped = 0;

for (const file of files) {
  if (!STRIPPABLE.has(extname(file).toLowerCase())) {
    const { found } = scan(file, readFileSync(file));
    if (found.length) {
      console.warn(`  skipped ${file}: ${found.join(', ')}`);
      skipped++;
    }
    continue;
  }
  const buf = readFileSync(file);
  const { found, out } = scan(file, buf, { strip: true });
  if (found.length) {
    writeFileSync(file, out);
    console.log(`  stripped ${file}: ${[...new Set(found)].join(', ')}`);
    changed++;
  }
}

console.log(`Done: ${changed} file(s) stripped${skipped ? `, ${skipped} need manual work` : ''}.`);
if (skipped) process.exit(1);
