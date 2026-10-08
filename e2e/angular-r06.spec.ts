import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const apiBase = 'http://127.0.0.1:4191/api/v1';
const r06Phone = '+201000000006';
const password = 'Mada@2026';

async function loginApi(request: APIRequestContext) {
  const response = await request.post(`${apiBase}/auth/login`, { data: { phone: r06Phone, password, accountType: 'staff' } });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()).data as { accessToken: string; refreshToken: string };
}

async function loginUi(page: Page) {
  await page.goto('/login');
  await page.getByLabel('نوع الحساب').selectOption('staff');
  await page.getByLabel('رقم الهاتف').fill(r06Phone);
  await page.getByRole('textbox', { name: 'كلمة المرور' }).fill(password);
  await page.getByRole('button', { name: /دخول إلى المساحة/ }).click();
  await expect(page).toHaveURL(/\/workspace$/);
}

test.describe('Angular R06 finance flow', () => {
  test('loads finance APIs without client-selected tenant or branch scope', async ({ request }) => {
    const tokens = await loginApi(request);
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };
    const responses = await Promise.all([
      request.get(`${apiBase}/finance/invoices`, { headers }),
      request.get(`${apiBase}/finance/expenses?status=ALL`, { headers }),
      request.get(`${apiBase}/finance/reports/summary`, { headers }),
    ]);
    for (const response of responses) {
      expect(response.ok(), await response.text()).toBeTruthy();
      expect(response.url()).not.toMatch(/tenantId|branchId/);
    }
  });

  test('renders the live FinanceDesk and exposes R06-B operations', async ({ page }) => {
    const capturedUrls: string[] = [];
    page.on('request', request => { if (request.url().includes('/api/v1/')) capturedUrls.push(request.url()); });
    await loginUi(page);
    await page.goto('/finance');
    await expect(page.getByText('LIVE · بيانات مالية من الخادم', { exact: false })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'إصدار وتحصيل وتوثيق', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'الفواتير', exact: true })).toBeVisible();
    await expect(page.getByText('بيانات تجريبية', { exact: false })).toHaveCount(0);
    expect(capturedUrls.some(url => url.includes('/finance/invoices'))).toBeTruthy();
    expect(capturedUrls.some(url => url.includes('/finance/expenses'))).toBeTruthy();
    expect(capturedUrls.some(url => url.includes('/finance/reports/summary'))).toBeTruthy();
    expect(capturedUrls.every(url => !url.includes('tenantId=') && !url.includes('branchId='))).toBeTruthy();
  });
});
