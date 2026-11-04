// Renders the PWA/app icons from the SVG masters in design/. Run: node scripts/generate-icons.mjs
// The PNGs are committed; re-run only when an SVG changes. `sharp` (an image
// library) is already installed as a dependency of Next.js, so nothing extra is needed.
//
// Two masters (design handoff 01):
// - design/icon.svg: full-bleed square, artwork inside the central 60% safe zone.
//   Used as-is for every launcher icon, including the maskable one (padding it
//   again would shrink the letters) and the Apple touch icon (iOS rounds the
//   corners itself, so it must not be pre-rounded).
// - design/favicon.svg: letters only, pre-rounded, for browser tabs at 32 px.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const master = await readFile(new URL('../design/icon.svg', import.meta.url));
const favicon = await readFile(new URL('../design/favicon.svg', import.meta.url));
const out = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname;

const targets = [
  ['icon-192.png', 192, master],
  ['icon-512.png', 512, master],
  ['maskable-512.png', 512, master], // same full-bleed artwork; the OS crops it to its own shape
  ['apple-touch-icon.png', 180, master],
  ['favicon-32.png', 32, favicon],
];

for (const [name, size, svg] of targets) {
  await sharp(svg, { density: 300 }).resize(size, size).png({ compressionLevel: 9 }).toFile(out(name));
  console.log(`public/icons/${name} (${size}×${size})`);
}
