/**
 * End-to-end credentials (set in the shell or `.env.local` before running Playwright).
 *
 * - `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` — profile role `admin`
 * - `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` — normal `user`
 */
export const e2eEnv = {
  adminEmail: process.env.E2E_ADMIN_EMAIL ?? "",
  adminPassword: process.env.E2E_ADMIN_PASSWORD ?? "",
  userEmail: process.env.E2E_USER_EMAIL ?? "",
  userPassword: process.env.E2E_USER_PASSWORD ?? "",
};

export function hasAdminCreds(): boolean {
  return Boolean(e2eEnv.adminEmail && e2eEnv.adminPassword);
}

export function hasUserCreds(): boolean {
  return Boolean(e2eEnv.userEmail && e2eEnv.userPassword);
}
