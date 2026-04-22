import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { tinyPngFile } from "./helpers/e2e-files";
import { e2eEnv, hasAdminCreds } from "./helpers/env";

test.describe("article page rendering", () => {
  test("loads by slug, shows hero, and renders ordered editorial sections with images", async ({
    page,
  }) => {
    test.skip(!hasAdminCreds(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

    const stamp = Date.now();
    const slug = `e2e-article-${stamp}`;

    await login(page, e2eEnv.adminEmail, e2eEnv.adminPassword);

    await page.goto("/admin/posts/new");
    await page.getByLabel("Title").fill(`Article Render ${stamp}`);
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Category").selectOption("Anime");
    await page.getByLabel("Status").selectOption("published");
    await page
      .locator('input[name="card_image"]')
      .setInputFiles(tinyPngFile("card.png"));
    await page
      .locator('input[name="hero_image"]')
      .setInputFiles(tinyPngFile("hero.png"));
    await page.locator("#section_1_text").fill("Section one copy.");
    await page.locator('input[name="section_1_image"]').setInputFiles(
      tinyPngFile("s1.png"),
    );
    await page.locator("#section_2_text").fill("Section two copy.");
    await page.getByRole("button", { name: /Create post/i }).click();
    await page.waitForURL(/\/admin\/posts\/[^/]+\/edit/, { timeout: 120_000 });

    await page.goto(`/articles/${slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: `Article Render ${stamp}` }),
    ).toBeVisible();

    const hero = page.locator("article").locator("img").first();
    await expect(hero).toBeVisible();

    await expect(page.locator('[data-article-mode="editorial"]')).toBeVisible();
    const sec1 = page.locator('[data-article-section="1"]');
    await expect(sec1.filter({ hasText: "Section one copy." })).toBeVisible();
    await expect(
      page.locator('[data-article-section-image="1"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-article-section="2"]').filter({
        hasText: "Section two copy.",
      }),
    ).toBeVisible();
  });
});
