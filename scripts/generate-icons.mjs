// Renders the PWA/app icons from design/icon.svg. Run: node scripts/generate-icons.mjs
// The PNGs are committed; re-run only when the SVG changes. `sharp` (an image
// library) is already installed as a dependency of Next.js, so nothing extra is needed.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const svg = await readFile(new URL('../design/icon.svg', import.meta.url));
const out = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname;

const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['maskable-512.png', 512], // same full-bleed artwork; the OS crops it to its own shape
  ['apple-touch-icon.png', 180],
  ['favicon-32.png', 32],
];

for (const [name, size] of targets) {
  await sharp(svg, { density: 300 }).resize(size, size).png({ compressionLevel: 9 }).toFile(out(name));
  console.log(`public/icons/${name} (${size}×${size})`);
}
