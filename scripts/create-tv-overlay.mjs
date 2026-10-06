import fs from 'node:fs/promises';
import sharp from 'sharp';

const [screen, output] = process.argv.slice(2);
if (!screen || !output) throw new Error('Usage: node scripts/create-tv-overlay.mjs <screen> <output>');

const screenshot = await sharp(screen).resize(336, 197, { fit: 'cover', position: 'top' }).png().toBuffer();
const data = screenshot.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><clipPath id="display"><path d="M944 87 L1279 66 L1279 255 L944 246 Z"/></clipPath></defs>
  <g clip-path="url(#display)">
    <path d="M941 84 L1280 61 L1280 261 L941 250 Z" fill="#dfe8e2"/>
    <image x="943" y="67" width="337" height="190" preserveAspectRatio="none" xlink:href="data:image/png;base64,${data}" opacity=".94"/>
    <path d="M944 87 L1279 66 L1279 255 L944 246 Z" fill="#dce8dd" opacity=".08"/>
  </g>
</svg>`;
await fs.writeFile(output, await sharp(Buffer.from(svg)).png().toBuffer());
