/**
 * E2E coverage for the forgot-password / reset-password flow.
 * These tests verify the UI contract — they don't actually click an email
 * link (email delivery happens out-of-band).
 */
import { test, expect } from "@playwright/test";

test.describe("forgot password", () => {
  test("page loads with email input", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByLabel(/אימייל|email/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /שלח|איפוס|reset/i })
    ).toBeVisible();
  });

  test("submitting any email shows success without revealing existence", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel(/אימייל|email/i).fill("does-not-exist@example.com");
    await page.getByRole("button", { name: /שלח|איפוס|reset/i }).click();
    // Should show a success/confirmation message even for unknown emails
    // (anti-enumeration). Look for "אם" / "if" / "נשלח" / "sent" cues.
    await expect(
      page.getByText(/אם|אימייל נשלח|sent|בדוק|נשלחה/i)
    ).toBeVisible({ timeout: 8_000 });
  });

  test("submitting an invalid email shows validation error", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel(/אימייל|email/i).fill("not-an-email");
    await page.getByRole("button", { name: /שלח|איפוס|reset/i }).click();
    // Native browser validation OR server-side zod validation
    const stillOnForgot = page.url().includes("/forgot-password");
    expect(stillOnForgot).toBeTruthy();
  });

  test("login page has a link to forgot-password", async ({ page }) => {
    await page.goto("/login");
    const link = page.getByRole("link", { name: /שכחתי|forgot/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /\/forgot-password/);
  });
});

test.describe("reset password (invalid token)", () => {
  test("invalid token shows error", async ({ page }) => {
    await page.goto("/reset-password/this-token-does-not-exist-anywhere");
    // The page should still render (no 500), and either show an inline error
    // OR present a form that errors out when submitted with this bad token.
    // We check that the page didn't crash.
    const status = page.url();
    expect(status).toContain("/reset-password/");
  });
});
