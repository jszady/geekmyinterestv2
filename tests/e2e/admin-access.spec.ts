import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { e2eEnv, hasAdminCreds, hasUserCreds } from "./helpers/env";

test.describe("admin access control", () => {
  test("guest visiting /admin is redirected to login with a return path", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/login/, { timeout: 60_000 });
    expect(page.url()).toContain("next=%2Fadmin");
  });

  test("non-admin user cannot stay on /admin (development shows denial query)", async ({
    page,
  }) => {
    test.skip(!hasUserCreds(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

    await login(page, e2eEnv.userEmail, e2eEnv.userPassword);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/admin");
    expect(
      page.url().includes("adminDenied=1") || page.url().match(/\/($|\?)/),
    ).toBeTruthy();
  });

  test("admin can open /admin and sees the dashboard chrome", async ({
    page,
  }) => {
    test.skip(!hasAdminCreds(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

    await login(page, e2eEnv.adminEmail, e2eEnv.adminPassword);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
    await expect(page.getByRole("link", { name: "New post" })).toBeVisible();
  });
});
