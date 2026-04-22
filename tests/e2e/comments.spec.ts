import { expect, test } from "@playwright/test";
import { login, logout } from "./helpers/auth";
import { tinyPngFile } from "./helpers/e2e-files";
import { e2eEnv, hasAdminCreds, hasUserCreds } from "./helpers/env";

test.describe("article comments", () => {
  test("guests can read the thread UI; only signed-in users can compose", async ({
    page,
    browser,
  }) => {
    test.skip(
      !hasAdminCreds() || !hasUserCreds(),
      "Set E2E_ADMIN_* and E2E_USER_* credentials",
    );

    const stamp = Date.now();
    const slug = `e2e-comments-${stamp}`;

    await login(page, e2eEnv.adminEmail, e2eEnv.adminPassword);
    await page.goto("/admin/posts/new");
    await page.getByLabel("Title").fill(`Comment Target ${stamp}`);
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Category").selectOption("Movie");
    await page.getByLabel("Status").selectOption("published");
    await page
      .locator('input[name="card_image"]')
      .setInputFiles(tinyPngFile("c.png"));
    await page
      .locator('input[name="hero_image"]')
      .setInputFiles(tinyPngFile("h.png"));
    await page.locator("#section_1_text").fill("Discuss.");
    await page.getByRole("button", { name: /Create post/i }).click();
    await page.waitForURL(/\/admin\/posts\/[^/]+\/edit/, { timeout: 120_000 });

    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    await guestPage.goto(`/articles/${slug}`);
    await expect(
      guestPage.getByRole("heading", { name: "Comments" }),
    ).toBeVisible();
    await expect(guestPage.getByTestId("comment-guest-prompt")).toBeVisible();
    await expect(guestPage.getByTestId("comment-form")).toHaveCount(0);
    await guest.close();

    await page.goto(`/articles/${slug}`);
    await logout(page);
    await login(page, e2eEnv.userEmail, e2eEnv.userPassword);
    await page.goto(`/articles/${slug}`);

    await expect(page.getByTestId("comment-form")).toBeVisible();
    await page.locator("#comment-body").fill(`Hello from e2e ${stamp}`);
    await page.getByRole("button", { name: /Post comment/i }).click();
    await expect(
      page.getByText(`Hello from e2e ${stamp}`, { exact: false }),
    ).toBeVisible({ timeout: 120_000 });

    const label = (await page.getByTestId("comment-author-name").first().textContent())?.trim();
    expect(label?.length).toBeGreaterThan(0);
    expect(label).not.toMatch(/@/);
  });
});
