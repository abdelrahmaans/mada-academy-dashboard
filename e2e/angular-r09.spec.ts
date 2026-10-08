import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const apiBase = 'http://127.0.0.1:4191/api/v1';
const studentPhone = '+201000000012';
const password = 'Mada@2026';

async function loginApi(request: APIRequestContext) {
  const response = await request.post(`${apiBase}/auth/login`, { data: { phone: studentPhone, password, accountType: 'student' } });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()).data as { accessToken: string };
}

async function loginUi(page: Page) {
  await page.goto('/login');
  await page.getByLabel('نوع الحساب').selectOption('student');
  await page.getByLabel('رقم الهاتف').fill(studentPhone);
  await page.getByRole('textbox', { name: 'كلمة المرور' }).fill(password);
  await page.getByRole('button', { name: /دخول إلى المساحة/ }).click();
  await expect(page).toHaveURL(/\/workspace$/);
}

test.describe('Angular R09 student portal', () => {
  test('loads only linked student data from consumer endpoints', async ({ request }) => {
    const tokens = await loginApi(request);
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };
    const [students, sessions] = await Promise.all([
      request.get(`${apiBase}/consumer/me/students`, { headers }),
      request.get(`${apiBase}/consumer/me/sessions`, { headers }),
    ]);
    expect(students.status(), await students.text()).toBe(200);
    expect(sessions.status(), await sessions.text()).toBe(200);
    const studentsBody = await students.json();
    const sessionsBody = await sessions.json();
    expect(studentsBody.data.items).toHaveLength(1);
    expect(sessionsBody.data.items.every((item: { studentId: string }) => item.studentId === studentsBody.data.items[0].id)).toBeTruthy();
    expect(students.url()).not.toContain('tenantId=');
    expect(students.url()).not.toContain('branchId=');
    expect(sessions.url()).not.toContain('studentId=');
    expect(sessions.url()).not.toContain('tenantId=');
    expect(sessions.url()).not.toContain('branchId=');
  });

  test('renders the live Angular portal after R09 login without demo content', async ({ page }) => {
    const capturedUrls: string[] = [];
    page.on('request', (request) => { if (request.url().includes('/api/v1/')) capturedUrls.push(request.url()); });
    await loginUi(page);
    await page.goto('/student-portal');
    await expect(page.getByRole('heading', { name: 'مساحتي التعليمية', exact: true })).toBeVisible();
    await expect(page.getByText('LIVE · حساب الطالب', { exact: true })).toBeVisible();
    await expect(page.getByText('DEMO', { exact: false })).toHaveCount(0);
    await expect(page.getByText('Lina Omar', { exact: true })).toBeVisible();
    await expect(page.getByText('Youssef Ahmed', { exact: true })).toHaveCount(0);
    expect(capturedUrls.some((url) => url.endsWith('/consumer/me/students'))).toBeTruthy();
    expect(capturedUrls.some((url) => url.endsWith('/consumer/me/sessions'))).toBeTruthy();
    expect(capturedUrls.every((url) => !url.includes('studentId=') && !url.includes('tenantId=') && !url.includes('branchId='))).toBeTruthy();
  });

  test('shows only published evaluations for the linked student', async ({ request, page }) => {
    const tokens = await loginApi(request);
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };
    const studentsResponse = await request.get(`${apiBase}/consumer/me/students`, { headers });
    const studentId = (await studentsResponse.json()).data.items[0].id as string;
    const sessionsResponse = await request.get(`${apiBase}/consumer/me/sessions`, { headers });
    const sessions = (await sessionsResponse.json()).data.items as Array<{ studentId: string; score?: number | null; notes?: string | null }>;

    expect(sessions.every((item) => item.studentId === studentId)).toBeTruthy();
    expect(sessions.every((item) => item.score === null || item.score === undefined)).toBeTruthy();
    expect(sessions.every((item) => item.notes === null || item.notes === undefined)).toBeTruthy();

    await loginUi(page);
    await page.goto('/student-portal');
    await expect(page.getByText('لا توجد نتائج تقييم منشورة حتى الآن.', { exact: true })).toBeVisible();
    await expect(page.getByText('88 / 100', { exact: true })).toHaveCount(0);
    await expect(page.getByText('تقدم واضح في التطبيق العملي', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Youssef Ahmed', { exact: true })).toHaveCount(0);
  });
});
