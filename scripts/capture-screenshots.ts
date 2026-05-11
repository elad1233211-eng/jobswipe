/**
 * Captures Play Store screenshots at phone viewport (390×844, 3× DPI).
 * Output: 1170×2532 PNG — well within Play Store's 320–3840 range.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000          npx tsx scripts/capture-screenshots.ts
 *   BASE_URL=https://jobswipe-production... npx tsx scripts/capture-screenshots.ts
 *
 * Defaults to https://jobswipe-production.up.railway.app.
 */
import { chromium, Page } from "playwright";
import path from "node:path";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "https://jobswipe-production.up.railway.app";

const OUT_DIR = path.join(process.cwd(), "playstore-screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

const GOTO_OPTS = { waitUntil: "domcontentloaded" as const, timeout: 60_000 };

async function go(page: Page, url: string) {
  await page.goto(url, GOTO_OPTS);
}

async function login(page: Page, email: string, password: string) {
  await go(page, `${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app\//, { timeout: 15_000 });
}

async function shoot(page: Page, name: string) {
  await page.waitForTimeout(800);
  const out = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`  ✓ ${path.relative(process.cwd(), out)}`);
}

async function main() {
  console.log(`Capturing JobSwipe screenshots from ${BASE}`);
  console.log(`Output: ${OUT_DIR}\n`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
  });
  const page = await context.newPage();

  console.log("Public:");
  await go(page, BASE);
  await shoot(page, "01-landing");

  await go(page, `${BASE}/login`);
  await shoot(page, "02-login");

  // Use amit@demo.com instead of noa — noa has been used for manual testing
  // and her feed is already empty.
  console.log("\nCandidate (amit@demo.com):");
  await login(page, "amit@demo.com", "demo1234");

  await go(page, `${BASE}/app/feed`);
  await shoot(page, "03-feed");

  await go(page, `${BASE}/app/matches`);
  await shoot(page, "04-matches");

  const firstMatch = page.locator('a[href^="/app/matches/"]').first();
  if ((await firstMatch.count()) > 0) {
    await firstMatch.click();
    await page.waitForURL(/\/app\/matches\/[^/]+/, { timeout: 8_000 });
    await shoot(page, "05-chat");
  } else {
    console.log("  (no chat to capture)");
  }

  await go(page, `${BASE}/app/profile`);
  await shoot(page, "06-profile");

  console.log("\nEmployer (pizzaria@demo.com):");
  await go(page, `${BASE}/`);
  const logout = page.getByRole("button", { name: /יציאה/ }).first();
  if ((await logout.count()) > 0) {
    await logout.click();
    await page.waitForTimeout(1000);
  }

  await login(page, "pizzaria@demo.com", "demo1234");
  await go(page, `${BASE}/app/employer`);
  await shoot(page, "07-employer-dashboard");

  await browser.close();
  console.log("\nDone. Screenshots in playstore-screenshots/");
}

main().catch((e) => { console.error(e); process.exit(1); });
