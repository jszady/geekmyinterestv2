import { expect, test } from "@playwright/test";
import { login, logout } from "./helpers/auth";
import { e2eEnv, hasUserCreds } from "./helpers/env";

test.describe("authentication", () => {
  test("user can open the signup page and see the account form", async ({
    page,
  }) => {
    await page.goto("/signup");
    await expect(
      page.getByRole("heading", { name: "Create account" }),
    ).toBeVisible();
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Create account/i }),
    ).toBeVisible();
  });

  test("user can sign up with a unique email and is routed toward login", async ({
    page,
  }) => {
    const stamp = Date.now();
    const email = `e2e.signup.${stamp}@example.com`;
    await page.goto("/signup");
    await page.getByLabel("Username").fill(`e2euser${stamp}`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("e2e-password-123456");
    await page.getByRole("button", { name: /Create account/i }).click();
    await page.waitForURL(/\/login(\?|$)/, { timeout: 90_000 });
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  test("user can log in and log out; navbar reflects auth state", async ({
    page,
  }) => {
    test.skip(!hasUserCreds(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

    await page.goto("/");
    await expect(page.getByTestId("nav-login-desktop")).toBeVisible();

    await login(page, e2eEnv.userEmail, e2eEnv.userPassword);
    await expect(page.getByTestId("nav-username-desktop")).toContainText(
      /./,
    );
    await expect(page.getByTestId("nav-login-desktop")).toHaveCount(0);

    await logout(page);
    await expect(page.getByTestId("nav-login-desktop")).toBeVisible();
    await expect(page.getByTestId("nav-logout-desktop")).toHaveCount(0);
  });
});
