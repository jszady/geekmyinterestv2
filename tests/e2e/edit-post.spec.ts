import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { tinyPngFile } from "./helpers/e2e-files";
import { e2eEnv, hasAdminCreds } from "./helpers/env";

test.describe("admin edits posts", () => {
  test("admin can update fields; assigning a taken slot clears the previous published occupant", async ({
    page,
  }) => {
    test.skip(!hasAdminCreds(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

    const stamp = Date.now();
    const slugA = `e2e-edit-a-${stamp}`;
    const slugB = `e2e-edit-b-${stamp}`;
    const slugARenamed = `e2e-edit-a-renamed-${stamp}`;

    await login(page, e2eEnv.adminEmail, e2eEnv.adminPassword);

    await page.goto("/admin/posts/new");
    await page.getByLabel("Title").fill(`Edit A ${stamp}`);
    await page.getByLabel("Slug").fill(slugA);
    await page.getByLabel("Category").selectOption("Movie");
    await page.getByLabel("Status").selectOption("published");
    await page.getByLabel("Homepage slot").selectOption("feature_2");
    await page
      .locator('input[name="card_image"]')
      .setInputFiles(tinyPngFile("c1.png"));
    await page
      .locator('input[name="hero_image"]')
      .setInputFiles(tinyPngFile("h1.png"));
    await page.locator("#section_1_text").fill("First revision.");
    await page.getByRole("button", { name: /Create post/i }).click();
    await page.waitForURL(/\/admin\/posts\/[^/]+\/edit/, { timeout: 120_000 });
    const idA = page.url().match(/\/admin\/posts\/([^/]+)\/edit/)?.[1];
    expect(idA).toBeTruthy();

    await page.goto("/admin/posts/new");
    await page.getByLabel("Title").fill(`Edit B ${stamp}`);
    await page.getByLabel("Slug").fill(slugB);
    await page.getByLabel("Category").selectOption("Show");
    await page.getByLabel("Status").selectOption("published");
    await page.getByLabel("Homepage slot").selectOption("feature_2");
    await page
      .locator('input[name="card_image"]')
      .setInputFiles(tinyPngFile("c2.png"));
    await page
      .locator('input[name="hero_image"]')
      .setInputFiles(tinyPngFile("h2.png"));
    await page.locator("#section_1_text").fill("Second post.");
    await page.getByRole("button", { name: /Create post/i }).click();
    await page.waitForURL(/\/admin\/posts\/[^/]+\/edit/, { timeout: 120_000 });

    await page.goto("/");
    const f2 = page.locator('[data-editorial-slot="feature_2"]');
    await expect(f2).toContainText(`Edit B ${stamp}`);

    await page.goto(`/admin/posts/${idA}/edit`);
    await expect(page.getByLabel("Homepage slot")).toHaveValue("");

    await page.getByLabel("Title").fill(`Renamed A ${stamp}`);
    await page.getByLabel("Slug").fill(slugARenamed);
    await page.locator("#section_1_text").fill("Updated body.");
    await page.getByRole("button", { name: /Save changes/i }).click();
    await expect(page.getByText("Saved.", { exact: false })).toBeVisible({
      timeout: 120_000,
    });

    await page.goto(`/articles/${slugARenamed}`);
    await expect(
      page.getByRole("heading", { level: 1, name: `Renamed A ${stamp}` }),
    ).toBeVisible();
    await expect(page.getByText("Updated body.")).toBeVisible();
  });
});
