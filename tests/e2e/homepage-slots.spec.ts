import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { tinyPngFile } from "./helpers/e2e-files";
import { e2eEnv, hasAdminCreds } from "./helpers/env";

test.describe("homepage editorial slots", () => {
  test("slots map to fixed positions; unslotted posts stay out of featured but appear in Latest", async ({
    page,
  }) => {
    test.skip(!hasAdminCreds(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

    const stamp = Date.now();
    const slugMain = `e2e-slot-main-${stamp}`;
    const slugF1 = `e2e-slot-f1-${stamp}`;
    const slugF4 = `e2e-slot-f4-${stamp}`;
    const slugLoose = `e2e-slot-loose-${stamp}`;

    await login(page, e2eEnv.adminEmail, e2eEnv.adminPassword);

    async function createPublished(opts: {
      title: string;
      slug: string;
      slot: string;
    }) {
      await page.goto("/admin/posts/new");
      await page.getByLabel("Title").fill(opts.title);
      await page.getByLabel("Slug").fill(opts.slug);
      await page.getByLabel("Category").selectOption("Tech");
      await page.getByLabel("Status").selectOption("published");
      await page.getByLabel("Homepage slot").selectOption(opts.slot);
      await page
        .locator('input[name="card_image"]')
        .setInputFiles(tinyPngFile(`${opts.slug}-card.png`));
      await page
        .locator('input[name="hero_image"]')
        .setInputFiles(tinyPngFile(`${opts.slug}-hero.png`));
      await page.locator("#section_1_text").fill("Body.");
      await page.getByRole("button", { name: /Create post/i }).click();
      await page.waitForURL(/\/admin\/posts\/[^/]+\/edit/, { timeout: 120_000 });
    }

    await createPublished({
      title: `Slot Main ${stamp}`,
      slug: slugMain,
      slot: "main_feature",
    });
    await createPublished({
      title: `Slot F1 ${stamp}`,
      slug: slugF1,
      slot: "feature_1",
    });
    await createPublished({
      title: `Slot F4 ${stamp}`,
      slug: slugF4,
      slot: "feature_4",
    });
    await createPublished({
      title: `Slot Loose ${stamp}`,
      slug: slugLoose,
      slot: "",
    });

    await page.goto("/");

    await expect(
      page.locator('[data-editorial-slot="main_feature"]'),
    ).toContainText(`Slot Main ${stamp}`);
    await expect(
      page.locator('[data-editorial-slot="feature_1"]'),
    ).toContainText(`Slot F1 ${stamp}`);
    await expect(
      page.locator('[data-editorial-slot="feature_4"]'),
    ).toContainText(`Slot F4 ${stamp}`);

    await expect(
      page.locator('[data-editorial-slot="feature_1"]'),
    ).not.toContainText(`Slot F4 ${stamp}`);

    for (const slot of [
      "main_feature",
      "feature_1",
      "feature_2",
      "feature_3",
      "feature_4",
      "feature_5",
      "feature_6",
    ]) {
      await expect(
        page.locator(`[data-editorial-slot="${slot}"]`),
      ).not.toContainText(`Slot Loose ${stamp}`);
    }

    await page.getByRole("tab", { name: "ALL" }).click();
    await expect(
      page.locator(`[data-latest-slug="${slugLoose}"]`),
    ).toBeVisible();
    await expect(
      page.locator(`[data-latest-slug="${slugMain}"]`),
    ).toBeVisible();
  });
});
