// Finds and removes metadata (EXIF, GPS, XMP, IPTC, text chunks) in source images, losslessly:
// image data is copied byte for byte, only metadata blocks are dropped.

import { execFileSync } from 'node:child_process';
import { extname } from 'node:path';

export const STRIPPABLE = new Set(['.jpg', '.jpeg', '.png', '.webp']);
/** Formats whose metadata we cannot strip safely here: convert them before committing. */
export const UNSUPPORTED = new Set(['.heic', '.heif', '.avif', '.tif', '.tiff', '.dng', '.cr2', '.nef', '.arw', '.raw']);
/** Video containers: GPS lives in a "©xyz" atom. Strip with: ffmpeg -i in.mp4 -map_metadata -1 -c copy out.mp4 */
export const VIDEO = new Set(['.mp4', '.mov', '.m4v']);

export const isMedia = (file) => {
  const ext = extname(file).toLowerCase();
  return STRIPPABLE.has(ext) || UNSUPPORTED.has(ext) || VIDEO.has(ext);
};

/** Files git would commit: tracked plus untracked-but-not-ignored. With `staged`, only staged ones. */
export function candidateFiles({ staged = false } = {}) {
  const args = staged
    ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']
    : ['ls-files', '--cached', '--others', '--exclude-standard', '-z'];
  return execFileSync('git', args, { encoding: 'utf8' }).split('\0').filter(Boolean).filter(isMedia);
}

// JPEG: APP1 (Exif/XMP), APP13 (IPTC) and COM segments carry metadata. APP0 (JFIF),
// APP2 (ICC colour profile) and APP14 (Adobe) are kept.
const JPEG_DROP = new Set([0xe1, 0xed, 0xfe]);

function jpeg(buf, strip) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return { found: [], out: buf };
  const found = [];
  const keep = [buf.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buf.length && buf[i] === 0xff) {
    const marker = buf[i + 1];
    if (marker === 0xda) break; // start of scan: the rest is image data
    const len = buf.readUInt16BE(i + 2);
    const segment = buf.subarray(i, i + 2 + len);
    if (JPEG_DROP.has(marker)) {
      const label = marker === 0xe1 ? (segment.subarray(4, 8).toString('latin1') === 'Exif' ? 'EXIF' : 'XMP') : marker === 0xed ? 'IPTC' : 'comment';
      found.push(label);
    } else {
      keep.push(segment);
    }
    i += 2 + len;
  }
  keep.push(buf.subarray(i));
  return { found, out: strip && found.length ? Buffer.concat(keep) : buf };
}

const PNG_DROP = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt', 'tIME']);

function png(buf, strip) {
  const found = [];
  const keep = [buf.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= buf.length) {
    const len = buf.readUInt32BE(i);
    const type = buf.subarray(i + 4, i + 8).toString('latin1');
    const chunk = buf.subarray(i, i + 12 + len);
    if (PNG_DROP.has(type)) found.push(type === 'eXIf' ? 'EXIF' : `PNG ${type}`);
    else keep.push(chunk);
    i += 12 + len;
  }
  return { found, out: strip && found.length ? Buffer.concat(keep) : buf };
}

function webp(buf, strip) {
  if (buf.subarray(0, 4).toString('latin1') !== 'RIFF' || buf.subarray(8, 12).toString('latin1') !== 'WEBP') {
    return { found: [], out: buf };
  }
  const found = [];
  const keep = [];
  let i = 12;
  while (i + 8 <= buf.length) {
    const type = buf.subarray(i, i + 4).toString('latin1');
    const len = buf.readUInt32LE(i + 4);
    const chunk = Buffer.from(buf.subarray(i, i + 8 + len + (len % 2)));
    if (type === 'EXIF' || type === 'XMP ') found.push(type.trim());
    else {
      if (type === 'VP8X' && strip) chunk[8] &= ~0x0c; // clear the EXIF and XMP flags
      keep.push(chunk);
    }
    i += 8 + len + (len % 2);
  }
  if (!strip || !found.length) return { found, out: buf };
  const body = Buffer.concat(keep);
  const header = Buffer.alloc(12);
  header.write('RIFF', 0, 'latin1');
  header.writeUInt32LE(body.length + 4, 4);
  header.write('WEBP', 8, 'latin1');
  return { found, out: Buffer.concat([header, body]) };
}

/** Inspect (and optionally strip) one file's contents. */
export function scan(file, buf, { strip = false } = {}) {
  const ext = extname(file).toLowerCase();
  if (UNSUPPORTED.has(ext)) return { found: ['unsupported format: convert to JPEG, PNG or WebP'], out: buf };
  if (VIDEO.has(ext)) {
    return { found: buf.includes(Buffer.from([0xa9, 0x78, 0x79, 0x7a])) ? ['GPS location (©xyz)'] : [], out: buf };
  }
  if (ext === '.png') return png(buf, strip);
  if (ext === '.webp') return webp(buf, strip);
  return jpeg(buf, strip);
}
