// Regenerates every raster brand asset in public/ from the SVG masters in
// logos/. Run after any master changes:  node scripts/generate-brand-rasters.mjs
// sharp ships with Astro's image service, so this adds no dependency.
import sharp from "sharp";

const jobs = [
  // Study E stamp-avatar is the full-bleed crop drawn for app icons/avatars.
  ["logos/study-e-stamp/stamp-avatar.svg", "public/apple-touch-icon.png", 180, 180],
  ["logos/study-e-stamp/stamp-avatar.svg", "public/icon-192.png", 192, 192],
  ["logos/study-e-stamp/stamp-avatar.svg", "public/icon-512.png", 512, 512],
  // Link-preview card; referenced as og:image from Layout.astro.
  ["logos/og-card.svg", "public/og-card.png", 1200, 630],
];

for (const [src, out, w, h] of jobs) {
  await sharp(src, { density: 300 }).resize(w, h).png().toFile(out);
  console.log(`${src} -> ${out} (${w}x${h})`);
}
