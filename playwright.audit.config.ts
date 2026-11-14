import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["**/multi-role-ux-audit.spec.ts"],
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    ...devices["Desktop Chrome"],
    browserName: "chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  },
});
