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

/**
 * 파비콘 및 앱 아이콘 생성 스크립트
 * 실행: node tools/generate_favicons.mjs
 * 전제: Next.js 의존성(sharp) 사용
 *
 * 규칙:
 * - 16, 32, 48 파비콘: 브라우저 탭용 투명 배경
 * - 180 (apple-touch-icon), 192, 512 (PWA 아이콘): iOS/런처 투명 검정 채움 방지를 위해 manifest background_color(#faf9fe) 불투명 배경
 */
async function main() {
  console.log('Generating favicons & app icons from:', SRC);

  // 1. Trim transparent padding to tightly frame the logo
  const trimmed = await sharp(SRC).trim().toBuffer();

  const BRAND_BG = { r: 250, g: 249, b: 254, alpha: 1 }; // #faf9fe
  const TRANSPARENT_BG = { r: 0, g: 0, b: 0, alpha: 0 };

  async function makeIcon(size, paddingRatio = 0.04, bg = TRANSPARENT_BG) {
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
        background: bg,
      },
    })
      .composite([{ input: innerBuf, gravity: 'center' }])
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();
  }

  // 2. Generate PNGs: 탭 파비콘은 투명, 모바일/터치 아이콘은 #faf9fe 불투명
  const [b16, b32, b48, b180, b192, b512] = await Promise.all([
    makeIcon(16, 0.03, TRANSPARENT_BG),
    makeIcon(32, 0.03, TRANSPARENT_BG),
    makeIcon(48, 0.04, TRANSPARENT_BG),
    makeIcon(180, 0.1, BRAND_BG),
    makeIcon(192, 0.08, BRAND_BG),
    makeIcon(512, 0.08, BRAND_BG),
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

  // HTML은 /eottae/favicon.ico를 참조하므로 public/favicon.ico만 유지
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuf);

  // 불필요한 사본 정리
  for (const extra of [
    path.join(ICONS_DIR, 'favicon.ico'),
    path.join(APP_DIR, 'favicon.ico'),
    path.join(APP_DIR, 'icon.png'),
  ]) {
    if (fs.existsSync(extra)) fs.unlinkSync(extra);
  }

  console.log('Successfully generated favicons and app icons!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
