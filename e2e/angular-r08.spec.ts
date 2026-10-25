import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const apiBase = 'http://127.0.0.1:4191/api/v1';
const parentPhone = '+201000000011';
const password = 'Mada@2026';

async function loginApi(request: APIRequestContext) {
  const response = await request.post(`${apiBase}/auth/login`, { data: { phone: parentPhone, password, accountType: 'parent' } });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()).data as { accessToken: string };
}

async function loginUi(page: Page) {
  await page.goto('/login');
  await page.getByLabel('نوع الحساب').selectOption('parent');
  await page.getByLabel('رقم الهاتف').fill(parentPhone);
  await page.getByRole('textbox', { name: 'كلمة المرور' }).fill(password);
  await page.getByRole('button', { name: /دخول إلى المساحة/ }).click();
  await expect(page).toHaveURL(/\/workspace$/);
}

test.describe('Angular R08 family portal', () => {
  test('returns only linked children, sessions, and published evaluations', async ({ request }) => {
    const tokens = await loginApi(request);
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };
    const childrenResponse = await request.get(`${apiBase}/consumer/me/students`, { headers });
    const sessionsResponse = await request.get(`${apiBase}/consumer/me/sessions`, { headers });
    const invoicesResponse = await request.get(`${apiBase}/consumer/invoices`, { headers });
    expect(childrenResponse.ok()).toBeTruthy();
    expect(sessionsResponse.ok()).toBeTruthy();
    expect(invoicesResponse.ok()).toBeTruthy();
    const children = (await childrenResponse.json()).data.items as Array<{ id: string; name: string }>;
    const sessions = (await sessionsResponse.json()).data.items as Array<{ studentId: string; score?: number | null; notes?: string | null }>;
    const linkedStudentIds = new Set(children.map((child) => child.id));
    expect(children.map((child) => child.name).sort()).toEqual(['Adam Khaled', 'Youssef Ahmed'].sort());
    const youssef = children.find((child) => child.name === 'Youssef Ahmed');
    expect(youssef).toBeDefined();
    expect(sessions.every((item) => linkedStudentIds.has(item.studentId))).toBeTruthy();
    expect(sessions.some((item) => item.studentId === youssef?.id && item.score === 88)).toBeTruthy();
    expect(sessions.some((item) => item.score === 91)).toBe(false);
    expect((await invoicesResponse.json()).data.items.every((item: { studentId: string }) => linkedStudentIds.has(item.studentId))).toBeTruthy();
    for (const response of [childrenResponse, sessionsResponse, invoicesResponse]) expect(response.url()).not.toMatch(/studentId|tenantId|branchId/);
  });

  test('renders the live family portal without demo content or another child evaluation', async ({ page }) => {
    const capturedUrls: string[] = [];
    page.on('request', (request) => { if (request.url().includes('/api/v1/')) capturedUrls.push(request.url()); });
    await loginUi(page);
    await page.goto('/family-portal');
    await expect(page.getByRole('heading', { name: 'بوابة الأسرة', exact: true })).toBeVisible();
    await expect(page.getByText('LIVE · بيانات الحساب', { exact: true })).toBeVisible();
    const childSwitcher = page.getByRole('navigation', { name: 'اختيار الطفل' });
    await expect(childSwitcher.getByRole('button', { name: /Adam Khaled/ })).toBeVisible();
    await expect(childSwitcher.getByRole('button', { name: /Youssef Ahmed/ })).toBeVisible();
    await expect(childSwitcher.getByRole('button', { name: /Lina Omar/ })).toHaveCount(0);
    await childSwitcher.getByRole('button', { name: /Youssef Ahmed/ }).click();
    await expect(page.getByRole('heading', { name: 'Youssef Ahmed', exact: true })).toBeVisible();
    await expect(page.getByText('Lina Omar', { exact: true })).toHaveCount(0);
    await expect(page.getByText('88 / 100', { exact: true })).toBeVisible();
    await expect(page.getByText('تقدم واضح في التطبيق العملي', { exact: true })).toBeVisible();
    await expect(page.getByText('91 / 100', { exact: true })).toHaveCount(0);
    await childSwitcher.getByRole('button', { name: /Adam Khaled/ }).click();
    await expect(page.getByRole('heading', { name: 'Adam Khaled', exact: true })).toBeVisible();
    await expect(page.getByText('تقدم واضح في التطبيق العملي', { exact: true })).toHaveCount(0);
    await expect(page.getByText('88 / 100', { exact: true })).toHaveCount(0);
    await expect(page.getByText('DEMO', { exact: false })).toHaveCount(0);
    expect(capturedUrls.some((url) => url.endsWith('/consumer/me/students'))).toBeTruthy();
    expect(capturedUrls.some((url) => url.endsWith('/consumer/me/sessions'))).toBeTruthy();
    expect(capturedUrls.some((url) => url.endsWith('/consumer/invoices'))).toBeTruthy();
    expect(capturedUrls.every((url) => !url.match(/studentId|tenantId|branchId/))).toBeTruthy();
  });
});
