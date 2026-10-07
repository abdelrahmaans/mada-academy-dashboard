import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const apiBase = 'http://127.0.0.1:4191/api/v1';
const r04Phone = '+201000000010';
const password = 'Mada@2026';

async function loginApi(request: APIRequestContext) {
  const response = await request.post(`${apiBase}/auth/login`, { data: { phone: r04Phone, password, accountType: 'staff' } });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()).data as { accessToken: string; refreshToken: string };
}

async function loginUi(page: Page) {
  await page.goto('/login');
  await page.getByLabel('نوع الحساب').selectOption('staff');
  await page.getByLabel('رقم الهاتف').fill(r04Phone);
  await page.getByRole('textbox', { name: 'كلمة المرور' }).fill(password);
  await page.getByRole('button', { name: /دخول إلى المساحة/ }).click();
  await expect(page).toHaveURL(/\/workspace$/);
}

test.describe('Angular R04 instructor flow', () => {
  test('loads assigned instructor workspace and does not send client-selected scope', async ({ request }) => {
    const tokens = await loginApi(request);
    const response = await request.get(`${apiBase}/sessions`, { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
    expect(response.status(), await response.text()).toBe(200);
    expect(response.url()).not.toContain('tenantId=');
    expect(response.url()).not.toContain('branchId=');
  });

  test('renders live attendance/evaluation workflow after the real R04 login', async ({ page }) => {
    const capturedUrls: string[] = [];
    page.on('request', (request) => { if (request.url().includes('/api/v1/')) capturedUrls.push(request.url()); });
    await loginUi(page);
    await page.goto('/instructor');
    await expect(page.getByRole('heading', { name: 'مكتب المدرب', exact: true })).toBeVisible();
    await expect(page.getByText('النطاق المطبق:', { exact: false })).toBeVisible();
    await expect(page.getByText('تقييم الطلاب', { exact: true })).toBeVisible();
    await expect(page.getByText('بيانات تجريبية', { exact: false })).toHaveCount(0);
    expect(capturedUrls.some((url) => url.includes('/sessions'))).toBeTruthy();
    expect(capturedUrls.some((url) => url.includes('/evaluations'))).toBeTruthy();
    expect(capturedUrls.every((url) => !url.includes('tenantId=') && !url.includes('branchId='))).toBeTruthy();
  });
});
