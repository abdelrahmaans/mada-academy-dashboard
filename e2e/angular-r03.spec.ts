import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

const apiBase = "http://127.0.0.1:4191/api/v1";
const r03Phone = "+201000000004";
const password = "Mada@2026";

async function loginApi(request: APIRequestContext) {
  const response = await request.post(`${apiBase}/auth/login`, {
    data: { phone: r03Phone, password, accountType: "staff" },
  });
  expect(response.status()).toBe(200);
  return (await response.json()).data as {
    accessToken: string;
    refreshToken: string;
  };
}

async function loginUi(page: Page) {
  await page.goto("/login");
  await page.getByLabel("نوع الحساب").selectOption("staff");
  await page.getByLabel("رقم الهاتف").fill(r03Phone);
  await page.getByLabel("كلمة المرور").fill(password);
  await page.getByRole("button", { name: /دخول إلى المساحة/ }).click();
  await expect(page).toHaveURL(/\/workspace$/);
}

test.describe("Angular R03 API integration", () => {
  test("loads every R03 data-access endpoint with backend-derived scope", async ({
    request,
  }) => {
    const tokens = await loginApi(request);
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };
    const windowStart = "2026-09-01T00:00:00.000Z";
    const windowEnd = "2026-12-31T23:59:59.000Z";

    const [
      me,
      groups,
      instructors,
      sessions,
      evaluations,
      notifications,
      reviews,
    ] = await Promise.all([
      request.get(`${apiBase}/me`, { headers }),
      request.get(`${apiBase}/scheduling/groups`, { headers }),
      request.get(`${apiBase}/scheduling/instructors`, { headers }),
      request.get(
        `${apiBase}/sessions?from=${encodeURIComponent(windowStart)}&to=${encodeURIComponent(windowEnd)}`,
        { headers }
      ),
      request.get(`${apiBase}/scheduling/evaluation-status-summary`, {
        headers,
      }),
      request.get(`${apiBase}/scheduling/notifications?unreadOnly=true`, {
        headers,
      }),
      request.get(`${apiBase}/scheduling/evaluation-reviews`, { headers }),
    ]);

    for (const response of [
      me,
      groups,
      instructors,
      sessions,
      evaluations,
      notifications,
      reviews,
    ]) {
      expect(response.status(), await response.text()).toBe(200);
      expect((await response.json()).data).toBeDefined();
    }

    const requestUrls = [
      groups,
      instructors,
      sessions,
      evaluations,
      notifications,
      reviews,
    ].map(response => response.url());
    expect(requestUrls.every(url => !url.includes("branchId="))).toBeTruthy();

    const meBody = await me.json();
    expect(meBody.data.role).toBe("R03_HEAD_INSTRUCTORS");
    expect(meBody.data.branchId).toBeTruthy();

    const forbiddenDecision = await request.post(
      `${apiBase}/scheduling/evaluation-reviews/00000000-0000-0000-0000-000000000000/decision`,
      { headers, data: { decision: "PUBLISH" } }
    );
    expect(forbiddenDecision.status()).toBe(404);
  });

  test("renders the Angular page only after the real login and preserves request scope", async ({
    page,
  }) => {
    const capturedUrls: string[] = [];
    page.on("request", request => {
      if (request.url().includes("/api/v1/")) capturedUrls.push(request.url());
    });

    await loginUi(page);
    await page.goto("/head-instructors");
    await expect(
      page.getByRole("heading", { name: "إشراف فريق المدربين", exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("بيانات مباشرة", { exact: false })
    ).toBeVisible();
    await expect(
      page.getByText("حالات التقييم", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("لم يتم تحميل أو عرض بيانات تجريبية", { exact: true })
    ).toHaveCount(0);

    expect(
      capturedUrls.some(url => url.endsWith("/scheduling/groups"))
    ).toBeTruthy();
    expect(capturedUrls.some(url => url.includes("/sessions?"))).toBeTruthy();
    expect(capturedUrls.every(url => !url.includes("branchId="))).toBeTruthy();
  });
});
