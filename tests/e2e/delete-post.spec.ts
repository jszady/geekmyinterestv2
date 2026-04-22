import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { tinyPngFile } from "./helpers/e2e-files";
import { e2eEnv, hasAdminCreds } from "./helpers/env";

test.describe("admin deletes posts", () => {
  test("deleting a published post removes it from admin, latest, and the article URL", async ({
    page,
  }) => {
    test.skip(!hasAdminCreds(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

    const stamp = Date.now();
    const slug = `e2e-delete-${stamp}`;
    const title = `Delete Me ${stamp}`;

    await login(page, e2eEnv.adminEmail, e2eEnv.adminPassword);

    await page.goto("/admin/posts/new");
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Category").selectOption("Game");
    await page.getByLabel("Status").selectOption("published");
    await page.getByLabel("Homepage slot").selectOption("");
    await page
      .locator('input[name="card_image"]')
      .setInputFiles(tinyPngFile("c.png"));
    await page
      .locator('input[name="hero_image"]')
      .setInputFiles(tinyPngFile("h.png"));
    await page.locator("#section_1_text").fill("To be removed.");
    await page.getByRole("button", { name: /Create post/i }).click();
    await page.waitForURL(/\/admin\/posts\/[^/]+\/edit/, { timeout: 120_000 });
    const postId = page.url().match(/\/admin\/posts\/([^/]+)\/edit/)?.[1];
    expect(postId).toBeTruthy();

    await page.goto(`/articles/${slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();

    await page.goto(`/admin/posts/${postId}/edit`);
    await page.getByTestId("admin-delete-open").click();
    await page.getByTestId("admin-delete-confirm").click();
    await page.waitForURL("/admin", { timeout: 120_000 });

    await expect(page.locator(`tbody tr:has-text("${title}")`)).toHaveCount(0);

    await page.goto("/");
    await page.getByRole("tab", { name: "ALL" }).click();
    await expect(page.locator(`[data-latest-slug="${slug}"]`)).toHaveCount(0);

    const rsp = await page.request.get(`/articles/${slug}`);
    expect(rsp.status()).toBe(404);
  });
});
