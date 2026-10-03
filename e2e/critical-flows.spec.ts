import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const apiBase = "http://127.0.0.1:5180/api/v1";

async function apiLogin(request: APIRequestContext) {
  const response = await request.post(`${apiBase}/auth/login`, {
    data: { phone: "+201000000006", password: "Mada@2026", accountType: "staff" },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.data.accessToken as string;
}

async function login(page: Page, accountType: "staff" | "parent" | "student", phone: string) {
  await page.goto("/login");
  await page.getByLabel("نوع الحساب").selectOption(accountType);
  await page.getByLabel("رقم الهاتف").fill(phone);
  await page.getByLabel("كلمة المرور").fill("Mada@2026");
  await page.getByRole("button", { name: /دخول إلى المساحة/ }).click();
}

test.describe("critical local MVP journeys", () => {
  test("Finance API completes invoice, payment, over-collection, and evidence lifecycle", async ({ request }) => {
    const token = await apiLogin(request);
    const headers = { Authorization: `Bearer ${token}` };
    const studentsResponse = await request.get(`${apiBase}/students`, { headers });
    expect(studentsResponse.ok()).toBeTruthy();
    const studentsBody = await studentsResponse.json();
    const studentId = studentsBody.data.items[0].id as string;

    const createInvoice = await request.post(`${apiBase}/finance/invoices`, {
      headers,
      data: {
        studentId,
        dueDate: "2026-10-31",
        lines: [{ description: "E2E October tuition", amountPiastres: 3000 }],
      },
    });
    expect(createInvoice.status()).toBe(201);
    const invoiceId = (await createInvoice.json()).data.id as string;

    const payment = await request.post(`${apiBase}/finance/invoices/${invoiceId}/payments`, {
      headers,
      data: { amountPiastres: 2000, method: "CASH", receivedOn: "2026-10-03" },
    });
    expect(payment.status()).toBe(201);
    const paymentId = (await payment.json()).data.payment.id as string;

    const overCollection = await request.post(`${apiBase}/finance/invoices/${invoiceId}/payments`, {
      headers,
      data: { amountPiastres: 1001, method: "VISA" },
    });
    expect(overCollection.status()).toBe(409);

    const upload = await request.post(`${apiBase}/finance/payments/${paymentId}/evidence`, {
      headers,
      multipart: {
        file: { name: "e2e-receipt.png", mimeType: "image/png", buffer: Buffer.from("fake-png-content") },
      },
    });
    expect(upload.ok()).toBeTruthy();

    const download = await request.get(`${apiBase}/finance/payments/${paymentId}/evidence`, { headers });
    expect(download.status()).toBe(200);
    expect(download.headers()["content-type"]).toContain("image/png");

    const invoice = await request.get(`${apiBase}/finance/invoices/${invoiceId}`, { headers });
    expect(invoice.ok()).toBeTruthy();
    expect((await invoice.json()).data.paidPiastres).toBe(2000);
  });

  test("R06 can enter the live FinanceDesk and see API-backed finance state", async ({ page }) => {
    await login(page, "staff", "+201000000006");
    await expect(page).toHaveURL(/\/finance-desk$/);
    await expect(page.getByText("الفواتير والتحصيل", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "الملخص المالي", exact: true })).toBeVisible();
    await expect(page.getByText("إجمالي التحصيل", { exact: true })).toBeVisible();
    await expect(page.getByText("المستحقات", { exact: true })).toBeVisible();
    await expect(page.getByText(/R06/).first()).toBeVisible();
    await expect(page.getByText("بيانات تجريبية")).toHaveCount(0);
  });

  test("R08 sees only linked finance and consumer data", async ({ page }) => {
    await login(page, "parent", "+201000000011");
    await expect(page).toHaveURL(/\/family-portal$/);
    await expect(page.getByText("بوابة الأسرة", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Youssef Ahmed", exact: true })).toBeVisible();
    await expect(page.getByText("Lina Omar", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: /^الفواتير/ }).click();
    await expect(page.getByText("الفواتير والمدفوعات", { exact: true })).toBeVisible();
  });

  test("R09 remains self-scoped in the student portal", async ({ page }) => {
    await login(page, "student", "+201000000012");
    await expect(page).toHaveURL(/\/student-portal$/);
    await expect(page.getByText("Lina Omar", { exact: true })).toBeVisible();
    await expect(page.getByText("Youssef Ahmed", { exact: true })).toHaveCount(0);
  });
});
