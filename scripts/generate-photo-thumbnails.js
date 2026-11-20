// Builds grid thumbnails for assets/images/photography.
//
// Originals stay in that folder (the gallery lightbox loads them). Thumbnails
// are JPEGs in assets/images/photography-thumbs, 800px on the long side and
// about 100 KB. That folder is a sibling on purpose: the photography page
// lists assets/images/photography through the GitHub contents API, which does
// not recurse, so thumbnails are never extra photos.
//
//   npm run photos:thumbs         write any missing or out-of-date thumbnails
//   npm run photos:thumbs:check   exit 1 if a thumbnail is missing or wrong
//
// CI runs the check. After adding a photo, run the writer and commit the JPEG.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'assets/images/photography');
const THUMB_DIR = path.join(ROOT, 'assets/images/photography-thumbs');
const LONG_SIDE = 800;
const TARGET_BYTES = 100 * 1024;
const MAX_BYTES = 120 * 1024;
const SOURCE_EXT = /\.(jpe?g|png|gif|webp)$/i;

function listSources() {
  return fs.readdirSync(SOURCE_DIR)
    .filter((name) => SOURCE_EXT.test(name))
    .sort();
}

function thumbName(filename) {
  return filename.replace(/\.[^.]+$/i, '.jpg');
}

async function render(sourcePath, quality) {
  return sharp(sourcePath, { failOn: 'none' })
    .rotate()
    .resize({
      width: LONG_SIDE,
      height: LONG_SIDE,
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}

// Drop quality until the file is near 100 KB. A simple frame can land lower.
async function buildThumb(sourcePath) {
  let quality = 80;
  let buffer = await render(sourcePath, quality);
  while (buffer.length > MAX_BYTES && quality > 40) {
    quality -= 8;
    buffer = await render(sourcePath, quality);
  }
  return buffer;
}

async function inspect(buffer) {
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width,
    height: meta.height,
    format: meta.format,
    bytes: buffer.length
  };
}

function problemsFor(info, label) {
  const problems = [];
  const longSide = Math.max(info.width || 0, info.height || 0);
  if (info.format !== 'jpeg') problems.push(`${label} is ${info.format}, not jpeg`);
  if (longSide > LONG_SIDE) problems.push(`${label} long side is ${longSide}, over ${LONG_SIDE}`);
  if (info.bytes > MAX_BYTES) {
    problems.push(`${label} is ${Math.round(info.bytes / 1024)} KB, over ${Math.round(MAX_BYTES / 1024)} KB`);
  }
  return problems;
}

async function main() {
  const check = process.argv.includes('--check');
  const sources = listSources();
  if (!check) fs.mkdirSync(THUMB_DIR, { recursive: true });

  const expected = new Set(sources.map(thumbName));
  const failures = [];

  for (const name of sources) {
    const destName = thumbName(name);
    const destPath = path.join(THUMB_DIR, destName);
    const sourcePath = path.join(SOURCE_DIR, name);

    if (check) {
      if (!fs.existsSync(destPath)) {
        failures.push(`missing thumbnail for ${name} (run npm run photos:thumbs)`);
        continue;
      }
      const info = await inspect(fs.readFileSync(destPath));
      failures.push(...problemsFor(info, destName));
      continue;
    }

    const buffer = await buildThumb(sourcePath);
    const info = await inspect(buffer);
    const bad = problemsFor(info, destName);
    if (bad.length) {
      failures.push(...bad);
      continue;
    }
    fs.writeFileSync(destPath, buffer);
    const kb = Math.round(info.bytes / 1024);
    console.log(`${destName} ${info.width}x${info.height} ${kb} KB`);
  }

  if (!check) {
    const extras = fs.readdirSync(THUMB_DIR).filter((name) => !expected.has(name));
    for (const extra of extras) {
      fs.unlinkSync(path.join(THUMB_DIR, extra));
      console.log(`removed stale thumbnail ${extra}`);
    }
  } else if (fs.existsSync(THUMB_DIR)) {
    const extras = fs.readdirSync(THUMB_DIR).filter((name) => !expected.has(name));
    for (const extra of extras) failures.push(`stale thumbnail ${extra}`);
  }

  if (failures.length) {
    for (const failure of failures) console.error(failure);
    process.exit(1);
  }

  if (check) {
    console.log(`${sources.length} photography thumbnails ok (about ${TARGET_BYTES / 1024} KB each)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
