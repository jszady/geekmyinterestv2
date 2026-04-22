import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { tinyPngFile } from "./helpers/e2e-files";
import { e2eEnv, hasAdminCreds } from "./helpers/env";

test.describe("author profile pages", () => {
  test("author byline opens the author page listing that author’s published posts", async ({
    page,
  }) => {
    test.skip(!hasAdminCreds(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

    const stamp = Date.now();
    const slug = `e2e-author-${stamp}`;
    const title = `Author Page Post ${stamp}`;

    await login(page, e2eEnv.adminEmail, e2eEnv.adminPassword);
    await page.goto("/admin/posts/new");
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Category").selectOption("Tech");
    await page.getByLabel("Status").selectOption("published");
    await page
      .locator('input[name="card_image"]')
      .setInputFiles(tinyPngFile("c.png"));
    await page
      .locator('input[name="hero_image"]')
      .setInputFiles(tinyPngFile("h.png"));
    await page.locator("#section_1_text").fill("Author listing body.");
    await page.getByRole("button", { name: /Create post/i }).click();
    await page.waitForURL(/\/admin\/posts\/[^/]+\/edit/, { timeout: 120_000 });

    await page.goto(`/articles/${slug}`);
    const authorLink = page.locator('article a[href^="/authors/"]').first();
    await expect(authorLink).toBeVisible();
    const authorName =
      (await authorLink.textContent())?.trim().replace(/\s+/g, " ") ?? "";
    expect(authorName.length).toBeGreaterThan(0);

    await authorLink.click();
    await expect(page).toHaveURL(
      new RegExp(`/authors/${encodeURIComponent(authorName)}(\\?|$)`),
    );
    await expect(
      page.getByRole("heading", { level: 1, name: authorName }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: title, exact: true }),
    ).toBeVisible();

    await expect(
      page.getByText(`Unrelated-${stamp}`, { exact: false }),
    ).toHaveCount(0);
  });
});
