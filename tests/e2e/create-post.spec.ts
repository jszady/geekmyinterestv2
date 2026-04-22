import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { tinyPngFile } from "./helpers/e2e-files";
import { e2eEnv, hasAdminCreds } from "./helpers/env";

test.describe("admin creates posts", () => {
  test("admin can create draft and published posts with core fields and images", async ({
    page,
  }) => {
    test.skip(!hasAdminCreds(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

    const stamp = Date.now();
    const titleDraft = `E2E Draft ${stamp}`;
    const slugDraft = `e2e-draft-${stamp}`;

    await login(page, e2eEnv.adminEmail, e2eEnv.adminPassword);
    await page.goto("/admin/posts/new");

    await page.getByLabel("Title").fill(titleDraft);
    await page.getByLabel("Slug").fill(slugDraft);
    await page.getByLabel("Excerpt").fill("Draft excerpt for e2e.");
    await page.getByLabel("Category").selectOption("Anime");
    await page.getByLabel("Status").selectOption("draft");
    await page.getByLabel("Homepage slot").selectOption("");
    await page
      .locator('input[name="card_image"]')
      .setInputFiles(tinyPngFile("card.png"));
    await page
      .locator('input[name="hero_image"]')
      .setInputFiles(tinyPngFile("hero.png"));
    await page.locator("#section_1_text").fill("Section one body.");
    await page.getByRole("button", { name: /Create post/i }).click();
    await page.waitForURL(/\/admin\/posts\/[^/]+\/edit/, { timeout: 120_000 });
    await expect(page.getByLabel("Title")).toHaveValue(titleDraft);

    const titlePub = `E2E Published ${stamp}`;
    const slugPub = `e2e-published-${stamp}`;
    await page.goto("/admin/posts/new");
    await page.getByLabel("Title").fill(titlePub);
    await page.getByLabel("Slug").fill(slugPub);
    await page.getByLabel("Excerpt").fill("Published excerpt.");
    await page.getByLabel("Category").selectOption("Tech");
    await page.getByLabel("Status").selectOption("published");
    await page.getByLabel("Homepage slot").selectOption("main_feature");
    await page
      .locator('input[name="card_image"]')
      .setInputFiles(tinyPngFile("card2.png"));
    await page
      .locator('input[name="hero_image"]')
      .setInputFiles(tinyPngFile("hero2.png"));
    await page.locator("#section_1_text").fill("Published section.");
    await page.getByRole("button", { name: /Create post/i }).click();
    await page.waitForURL(/\/admin\/posts\/[^/]+\/edit/, { timeout: 120_000 });

    await page.goto("/");
    await expect(
      page.locator('[data-editorial-slot="main_feature"]'),
    ).toContainText(titlePub);
    await page.getByRole("tab", { name: "ALL" }).click();
    await expect(
      page.locator(`[data-latest-slug="${slugPub}"]`),
    ).toBeVisible();
    await expect(
      page.locator(`[data-latest-slug="${slugDraft}"]`),
    ).toHaveCount(0);
  });
});
