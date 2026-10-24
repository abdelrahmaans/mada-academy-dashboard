import { defineConfig, devices } from "@playwright/test";

const apiUrl = "http://127.0.0.1:5180";
const webUrl = "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/angular-r03.spec.ts", "**/angular-r04.spec.ts", "**/angular-r06.spec.ts", "**/angular-r08.spec.ts", "**/angular-r09.spec.ts"],
  timeout: 45_000,
  fullyParallel: false,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: webUrl,
    ...devices["Desktop Chrome"],
    browserName: "chromium",
    headless: true,
    launchOptions: {
      ...(process.platform === "linux" && {
        executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      }),
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command:
        "dotnet run --project backend/MadaAcademy.Api/MadaAcademy.Api.csproj --no-launch-profile",
      env: {
        ASPNETCORE_ENVIRONMENT: "Development",
        DOTNET_ENVIRONMENT: "Development",
        MADA_DATABASE_MODE: "memory",
        MADA_SEED_DEMO_DATA: "true",
        ASPNETCORE_URLS: "http://127.0.0.1:5180",
      },
      url: `${apiUrl}/api/v1/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm dev --host 127.0.0.1",
      env: {
        VITE_API_URL: "http://127.0.0.1:5180/api/v1",
      },
      url: `${webUrl}/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
