/**
 * Generates PNG app icons from the SVG source at public/icons/icon.svg.
 * Run once:  npx tsx scripts/gen-icons.ts
 * Requires:  sharp (bundled with Next.js — no extra install needed)
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";

const SRC = path.join(process.cwd(), "public", "icons", "icon.svg");
const OUT_DIR = path.join(process.cwd(), "public", "icons");

const sizes = [
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 180, name: "apple-touch-icon.png" },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const { size, name } of sizes) {
    const dest = path.join(OUT_DIR, name);
    await sharp(SRC).resize(size, size).png().toFile(dest);
    console.log(`✓ ${name} (${size}×${size})`);
  }

  console.log("\nAll icons generated in public/icons/");
}

main().catch((e) => { console.error(e); process.exit(1); });
