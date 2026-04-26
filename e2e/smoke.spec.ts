/**
 * Smoke tests — verify critical pages load without errors.
 * These run against a live dev/prod server (no mocking).
 */

import { test, expect } from "@playwright/test";

// ── Public pages ────────────────────────────────────────────────

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/JobSwipe/);
  // At minimum the brand name should be visible
  await expect(page.getByText("JobSwipe")).toBeVisible();
});

test("health check returns ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);
});

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /התחברות|Login/i })).toBeVisible();
  await expect(page.getByLabel(/אימייל|email/i)).toBeVisible();
  await expect(page.getByLabel(/סיסמה|password/i)).toBeVisible();
});

test("signup page loads", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByLabel(/אימייל|email/i)).toBeVisible();
});

test("verify-email page loads without auth", async ({ page }) => {
  const res = await page.goto("/verify-email");
  // Either shows the page or redirects to login — either is acceptable
  expect(res?.status()).toBeLessThan(500);
});

test("invalid token shows error page", async ({ page }) => {
  await page.goto("/verify-email/invalid-token-that-does-not-exist");
  await expect(page.getByText(/פג תוקף|לא תקין/)).toBeVisible();
});

test("public candidate profile 404 on unknown id", async ({ page }) => {
  const res = await page.goto("/c/00000000-0000-0000-0000-000000000000");
  expect(res?.status()).toBe(404);
});

test("legal pages load", async ({ page }) => {
  for (const path of ["/legal/privacy", "/legal/terms", "/legal/accessibility"]) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
  }
});

// ── Auth-protected pages redirect to login ───────────────────────

test.describe("protected routes redirect to /login", () => {
  const protectedPaths = [
    "/app/feed",
    "/app/matches",
    "/app/profile",
    "/app/history",
    "/app/employer",
  ];

  for (const path of protectedPaths) {
    test(`${path} redirects unauthenticated`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test("admin redirects non-admin to home", async ({ page }) => {
  await page.goto("/admin");
  // Should either redirect to / or /login
  const url = page.url();
  expect(url).not.toContain("/admin");
});

// ── Auth flow ────────────────────────────────────────────────────

test("login with wrong credentials shows error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/אימייל|email/i).fill("nobody@example.com");
  await page.getByLabel(/סיסמה|password/i).fill("wrongpassword");
  await page.getByRole("button", { name: /כניסה|Login|התחבר/i }).click();
  await expect(page.getByText(/לא נכונים|Invalid|שגיאה/i)).toBeVisible();
});

test("demo candidate can log in", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/אימייל|email/i).fill("noa@demo.com");
  await page.getByLabel(/סיסמה|password/i).fill("demo1234");
  await page.getByRole("button", { name: /כניסה|Login|התחבר/i }).click();
  // After login, should land on /app/feed
  await expect(page).toHaveURL(/\/app\/feed/);
  await expect(page.getByText("JobSwipe")).toBeVisible();
});

test("demo employer can log in", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/אימייל|email/i).fill("pizzaria@demo.com");
  await page.getByLabel(/סיסמה|password/i).fill("demo1234");
  await page.getByRole("button", { name: /כניסה|Login|התחבר/i }).click();
  await expect(page).toHaveURL(/\/app\/employer/);
});
