import { defineConfig, devices } from '@playwright/test';

const apiUrl = 'http://127.0.0.1:4191';
const webUrl = 'http://127.0.0.1:4202';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/angular-r06.spec.ts',
  timeout: 45_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/angular-r06', open: 'never' }]],
  use: { baseURL: webUrl, ...devices['Desktop Chrome'], browserName: 'chromium', headless: true, launchOptions: { executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    { command: 'ASPNETCORE_ENVIRONMENT=Development DOTNET_ENVIRONMENT=Development MADA_DATABASE_MODE=memory MADA_SEED_DEMO_DATA=true MADA_JWT_SIGNING_KEY=ci-only-not-a-production-secret-32bytes-minimum ASPNETCORE_URLS=http://127.0.0.1:4191 dotnet run --project backend/MadaAcademy.Api/MadaAcademy.Api.csproj --no-launch-profile', url: `${apiUrl}/api/v1/health`, reuseExistingServer: false, timeout: 120_000 },
    { command: 'pnpm --dir client-angular start --host 127.0.0.1 --port 4202', url: `${webUrl}/login`, reuseExistingServer: false, timeout: 120_000 },
  ],
});
