// Writes each <img>'s intrinsic width/height onto the tag so the browser can
// reserve the right box before the file arrives (no layout shift as lazy
// images land). Idempotent — re-run after adding or replacing images:
//   node scripts/stamp-image-sizes.mjs
// Tags whose src isn't a local /images/ file are left alone. style.css keeps
// `img { height: auto }` so the pair reads as an aspect ratio, not a fixed
// height, wherever a rule sets only the width.
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const PAGES = ['index.html', 'qa-standards.html', 'test-automation-university.html', 'jobs.html'];
const IMG_TAG = /<img\b[^>]*>/g;
const sizes = new Map();

async function sizeOf(src) {
  if (!sizes.has(src)) {
    const file = path.resolve('public', src.replace(/^\//, ''));
    const { width, height } = await sharp(file).metadata();
    sizes.set(src, { width, height });
  }
  return sizes.get(src);
}

for (const page of PAGES) {
  let html = readFileSync(page, 'utf8');
  let stamped = 0;
  let kept = 0;
  const tags = html.match(IMG_TAG) || [];
  for (const tag of tags) {
    const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
    if (!src || !src.startsWith('/images/')) continue;
    const { width, height } = await sizeOf(src);
    // strip any earlier stamp so a replaced image picks up its new size
    const bare = tag.replace(/\s(width|height)="\d+"/g, '');
    const next = bare.replace(/\ssrc="([^"]+)"/, ` src="$1" width="${width}" height="${height}"`);
    if (next === tag) kept++;
    else {
      html = html.replace(tag, next);
      stamped++;
    }
  }
  writeFileSync(page, html);
  console.log(`[stamp-image-sizes] ${page}: ${stamped} stamped, ${kept} already current`);
}
