// Fails when a photo or video that git would commit still carries metadata (EXIF, GPS, XMP, ...).
// Runs before every build (npm run build) and in CI. `--staged` checks only staged files
// (for a pre-commit hook). Fix with: npm run media:strip
import { readFileSync } from 'node:fs';
import { candidateFiles, scan } from './lib/media-metadata.mjs';

const staged = process.argv.includes('--staged');
const problems = [];

for (const file of candidateFiles({ staged })) {
  const { found } = scan(file, readFileSync(file));
  if (found.length) problems.push(`  ${file}: ${[...new Set(found)].join(', ')}`);
}

if (problems.length) {
  console.error('Media metadata found. These files must not be published as they are:');
  console.error(problems.join('\n'));
  console.error('\nRun `npm run media:strip` (photos). For video: ffmpeg -i in.mp4 -map_metadata -1 -c copy out.mp4');
  process.exit(1);
}

console.log('Media metadata check: clean.');
