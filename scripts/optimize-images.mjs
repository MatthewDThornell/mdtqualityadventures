// Re-encodes public/images/*.jpg in place with mozjpeg at a fixed quality.
// Run manually after adding new photos: npm run optimize:images
import sharp from 'sharp';
import { readdirSync, statSync, renameSync, unlinkSync } from 'node:fs';
import path from 'node:path';

const IMAGES_DIR = path.resolve('public/images');
const QUALITY = 80;

const files = readdirSync(IMAGES_DIR).filter((f) => /\.jpe?g$/i.test(f));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Windows Defender/indexer transiently locks a just-written file, so a
// rename immediately after can fail with EPERM/UNKNOWN — retrying after a
// short backoff clears it every time in practice. Writing straight over the
// path sharp just read from (rather than to a separate tmp path first) hits
// a *different*, non-transient failure on Windows — sharp/libvips seems to
// still hold the source handle open — so this always goes through a tmp
// file + rename, never a same-path overwrite.
async function renameWithRetry(from, to, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    try {
      renameSync(from, to);
      return;
    } catch (err) {
      if (i === attempts - 1) throw err;
      await sleep(200 * (i + 1));
    }
  }
}

let totalBefore = 0;
let totalAfter = 0;
let changed = 0;

for (const file of files) {
  const full = path.join(IMAGES_DIR, file);
  const tmp = `${full}.tmp`;
  const before = statSync(full).size;

  await sharp(full).jpeg({ quality: QUALITY, mozjpeg: true }).toFile(tmp);
  const after = statSync(tmp).size;

  if (after < before) {
    await renameWithRetry(tmp, full);
    totalBefore += before;
    totalAfter += after;
    changed++;
    console.log(`${file}: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`);
  } else {
    unlinkSync(tmp);
  }
}

console.log(
  `\n${changed}/${files.length} files re-encoded, ${Math.round(totalBefore / 1024)}KB -> ${Math.round(totalAfter / 1024)}KB`,
);
