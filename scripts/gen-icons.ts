/**
 * Generates PNG app icons from the SVG source at public/icons/icon.svg.
 * Run once:  npx tsx scripts/gen-icons.ts
 * Requires:  sharp (bundled with Next.js — no extra install needed)
 *
 * Outputs:
 *   - public/icons/icon-192.png, icon-512.png, apple-touch-icon.png  (PWA + Apple)
 *   - playstore-icon-512.png                                          (Play Store hi-res)
 *   - android/app/src/main/res/mipmap-(density)/ic_launcher.png + _round + _foreground (native Android)
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public", "icons", "icon.svg");
const PUBLIC_ICONS = path.join(ROOT, "public", "icons");

const PWA_SIZES = [
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 180, name: "apple-touch-icon.png" },
];

const ANDROID_DENSITIES = [
  { folder: "mipmap-mdpi", size: 48 },
  { folder: "mipmap-hdpi", size: 72 },
  { folder: "mipmap-xhdpi", size: 96 },
  { folder: "mipmap-xxhdpi", size: 144 },
  { folder: "mipmap-xxxhdpi", size: 192 },
];

async function renderPng(svg: Buffer | string, size: number, outPath: string) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp(typeof svg === "string" ? Buffer.from(svg) : svg)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`  ✓ ${path.relative(ROOT, outPath)} (${size}×${size})`);
}

// Read source once.
const svgSource = fs.readFileSync(SRC);

// Foreground variant: same icon, transparent background (for Android adaptive icons).
// We strip the background <rect> and rounded mask, leaving just the briefcase + heart.
function buildForegroundSvg(): string {
  const original = svgSource.toString();
  // Remove the rounded-rect background (first <rect> after <defs>).
  return original.replace(
    /<rect width="512" height="512"[^/]*\/>/,
    '<rect width="512" height="512" fill="none"/>'
  );
}

async function main() {
  console.log("Generating JobSwipe icons...\n");

  console.log("PWA & Apple icons:");
  fs.mkdirSync(PUBLIC_ICONS, { recursive: true });
  for (const { size, name } of PWA_SIZES) {
    await renderPng(svgSource, size, path.join(PUBLIC_ICONS, name));
  }

  console.log("\nPlay Store hi-res icon:");
  await renderPng(svgSource, 512, path.join(ROOT, "playstore-icon-512.png"));

  console.log("\nAndroid launcher icons:");
  const fgSvg = buildForegroundSvg();
  for (const { folder, size } of ANDROID_DENSITIES) {
    const base = path.join(ROOT, "android", "app", "src", "main", "res", folder);
    await renderPng(svgSource, size, path.join(base, "ic_launcher.png"));
    await renderPng(svgSource, size, path.join(base, "ic_launcher_round.png"));
    await renderPng(fgSvg, size, path.join(base, "ic_launcher_foreground.png"));
  }

  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
