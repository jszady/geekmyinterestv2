import type { Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByTestId("nav-username-desktop").waitFor({
    state: "visible",
    timeout: 90_000,
  });
}

export async function logout(page: Page) {
  await page.getByTestId("nav-logout-desktop").click();
  await page.getByTestId("nav-login-desktop").waitFor({
    state: "visible",
    timeout: 60_000,
  });
}
