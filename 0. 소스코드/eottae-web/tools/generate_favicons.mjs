import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SRC = path.join(ROOT, 'public', 'eottae-logo-light.png');
const ICONS_DIR = path.join(ROOT, 'public', 'icons');
const PUBLIC_DIR = path.join(ROOT, 'public');
const APP_DIR = path.join(ROOT, 'src', 'app');

async function main() {
  console.log('Generating transparent favicons & app icons from:', SRC);

  // 1. Trim transparent padding to tightly frame the logo
  const trimmed = await sharp(SRC).trim().toBuffer();

  async function makeIcon(size, paddingRatio = 0.04) {
    const margin = Math.max(1, Math.round(size * paddingRatio));
    const inner = size - margin * 2;
    const innerBuf = await sharp(trimmed)
      .resize(inner, inner, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    return sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: innerBuf, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  // 2. Generate PNGs
  const [b16, b32, b48, b180, b192, b512] = await Promise.all([
    makeIcon(16, 0.03),
    makeIcon(32, 0.03),
    makeIcon(48, 0.04),
    makeIcon(180, 0.04),
    makeIcon(192, 0.04),
    makeIcon(512, 0.04),
  ]);

  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  fs.writeFileSync(path.join(ICONS_DIR, 'favicon-16x16.png'), b16);
  fs.writeFileSync(path.join(ICONS_DIR, 'favicon-32x32.png'), b32);
  fs.writeFileSync(path.join(ICONS_DIR, 'favicon-48x48.png'), b48);
  fs.writeFileSync(path.join(ICONS_DIR, 'apple-touch-icon.png'), b180);
  fs.writeFileSync(path.join(ICONS_DIR, 'icon-192.png'), b192);
  fs.writeFileSync(path.join(ICONS_DIR, 'icon-512.png'), b512);

  // Next.js metadata icon in src/app
  fs.writeFileSync(path.join(APP_DIR, 'icon.png'), b32);

  // 3. Generate multi-resolution ICO file (16, 32, 48)
  const icoItems = [
    { width: 16, height: 16, buffer: b16 },
    { width: 32, height: 32, buffer: b32 },
    { width: 48, height: 48, buffer: b48 },
  ];

  const count = icoItems.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type
  header.writeUInt16LE(count, 4); // count

  let offset = 6 + count * 16;
  const entries = [];
  for (const item of icoItems) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.width, 0);
    entry.writeUInt8(item.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(item.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += item.buffer.length;
  }

  const icoBuf = Buffer.concat([header, ...entries, ...icoItems.map((p) => p.buffer)]);

  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuf);
  fs.writeFileSync(path.join(ICONS_DIR, 'favicon.ico'), icoBuf);
  fs.writeFileSync(path.join(APP_DIR, 'favicon.ico'), icoBuf);

  console.log('Successfully generated transparent favicons and app icons!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
