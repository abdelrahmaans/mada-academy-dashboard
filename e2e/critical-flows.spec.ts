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
  await page.getByRole("textbox", { name: "كلمة المرور" }).fill("Mada@2026");
  await page.getByRole("button", { name: /دخول إلى المساحة/ }).click();
}

const FAMILY_LINKED_STUDENT_ID = "70000000-0000-0000-0000-000000000001";
const STUDENT_LINKED_STUDENT_ID = "70000000-0000-0000-0000-000000000002";

function mockConsumerSession(sessionId: string, studentId: string, studentName: string, courseName: string) {
  return {
    sessionId,
    studentId,
    studentName,
    sessionNumber: 1,
    startAt: "2026-10-10T10:00:00Z",
    endAt: "2026-10-10T11:00:00Z",
    status: "SCHEDULED",
    courseName,
    branchName: "الفرع الرئيسي",
    classroomName: "المعمل",
    attendanceStatus: "UNMARKED",
    score: null,
    notes: null,
  };
}

function mockConsumerInvoice(id: string, invoiceNumber: string, studentId: string) {
  return {
    id,
    invoiceNumber,
    tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    branchId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    studentId,
    issueDate: "2026-10-01",
    dueDate: "2026-10-31",
    totalPiastres: 10000,
    paidPiastres: 0,
    remainingPiastres: 10000,
    status: "OPEN",
    lines: [{ description: "رسوم اختبار الواجهة", amountPiastres: 10000 }],
    payments: [],
  };
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

  test("R08 filters sessions and invoices to children linked to the family account", async ({ page }) => {
    await page.route("**/api/v1/consumer/me/sessions**", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { items: [
          mockConsumerSession("session-linked-family", FAMILY_LINKED_STUDENT_ID, "Youssef Ahmed", "جلسة الطفل المرتبط"),
          mockConsumerSession("session-unlinked-family", STUDENT_LINKED_STUDENT_ID, "Lina Omar", "جلسة طفل غير مرتبط"),
        ], total: 2 } }),
      });
    });
    await page.route("**/api/v1/consumer/invoices", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { items: [
          mockConsumerInvoice("invoice-linked-family", "INV-LINKED-CHILD", FAMILY_LINKED_STUDENT_ID),
          mockConsumerInvoice("invoice-unlinked-family", "INV-UNLINKED-CHILD", STUDENT_LINKED_STUDENT_ID),
        ], total: 2 } }),
      });
    });

    await login(page, "parent", "+201000000011");
    await expect(page).toHaveURL(/\/family-portal$/);
    await expect(page.getByRole("heading", { name: "Youssef Ahmed", exact: true })).toBeVisible();
    await expect(page.getByText("جلسة الطفل المرتبط", { exact: true })).toBeVisible();
    await expect(page.getByText("جلسة طفل غير مرتبط", { exact: true })).toHaveCount(0);
    await expect(page.getByText("LIVE · بيانات الحساب", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /^الفواتير/ }).click();
    await expect(page.getByText("INV-LINKED-CHILD", { exact: true })).toBeVisible();
    await expect(page.getByText("INV-UNLINKED-CHILD", { exact: true })).toHaveCount(0);
  });

  test("R09 filters sessions to the student's linked profile", async ({ page }) => {
    await page.route("**/api/v1/consumer/me/sessions**", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { items: [
          mockConsumerSession("session-linked-student", STUDENT_LINKED_STUDENT_ID, "Lina Omar", "جلسة الطالب المرتبط"),
          mockConsumerSession("session-other-student", FAMILY_LINKED_STUDENT_ID, "Youssef Ahmed", "جلسة طالب آخر"),
        ], total: 2 } }),
      });
    });

    await login(page, "student", "+201000000012");
    await expect(page).toHaveURL(/\/student-portal$/);
    await page.locator("#student-portal-sidebar").getByRole("button", { name: "جلساتي", exact: true }).click();
    await expect(page.getByRole("main").getByText("جلسة الطالب المرتبط", { exact: true })).toBeVisible();
    await expect(page.getByText("جلسة طالب آخر", { exact: true })).toHaveCount(0);
    await expect(page.getByText("LIVE · حساب الطالب", { exact: true })).toBeVisible();
  });

  test("R08 keeps linked children and LIVE state when the sessions endpoint fails", async ({ page }) => {
    await page.route("**/api/v1/consumer/me/sessions**", route => route.abort());
    await login(page, "parent", "+201000000011");
    await expect(page).toHaveURL(/\/family-portal$/);
    await expect(page.getByRole("heading", { name: "Youssef Ahmed", exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("الجلسات غير متاحة مؤقتًا");
    await expect(page.getByText("LIVE · بيانات الحساب", { exact: true })).toBeVisible();
    await expect(page.getByText("DEMO · معاينة محلية", { exact: true })).toHaveCount(0);
    await expect(page.getByText("ياسين محمد علي", { exact: true })).toHaveCount(0);
    await expect(page.getByText("ليلى أحمد محمود", { exact: true })).toHaveCount(0);
  });

  test("R08 shows a real empty state, not demo children, when no linked students are returned", async ({ page }) => {
    await page.route("**/api/v1/consumer/me/students**", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { items: [], total: 0 } }),
      });
    });
    await login(page, "parent", "+201000000011");
    await expect(page).toHaveURL(/\/family-portal$/);
    await expect(page.getByText("لا توجد ملفات أطفال مرتبطة بهذا الحساب.", { exact: false })).toBeVisible();
    await expect(page.getByText("LIVE · بيانات الحساب", { exact: true })).toBeVisible();
    await expect(page.getByText("DEMO · معاينة محلية", { exact: true })).toHaveCount(0);
    await expect(page.getByText("ياسين محمد علي", { exact: true })).toHaveCount(0);
    await expect(page.getByText("ليلى أحمد محمود", { exact: true })).toHaveCount(0);
  });

  test("R09 shows a profile error without demo student data when the linked-student endpoint fails", async ({ page }) => {
    await page.route("**/api/v1/consumer/me/students**", route => route.abort());
    await login(page, "student", "+201000000012");
    await expect(page).toHaveURL(/\/student-portal$/);
    await expect(page.getByRole("alert")).toContainText("تعذر تحميل بيانات الطالب");
    await expect(page.getByRole("alert")).toContainText("إعادة المحاولة");
    await expect(page.getByText("LIVE · حساب الطالب", { exact: true })).toBeVisible();
    await expect(page.getByText("DEMO · حساب الطالب", { exact: true })).toHaveCount(0);
    await expect(page.getByText("روبوتكس مستوى 2", { exact: true })).toHaveCount(0);
    await expect(page.getByText("مستكشف الحلول", { exact: true })).toHaveCount(0);
  });

  test("R09 shows a real unlinked-profile state, not demo data, when no student link is returned", async ({ page }) => {
    await page.route("**/api/v1/consumer/me/students**", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { items: [], total: 0 } }),
      });
    });
    await login(page, "student", "+201000000012");
    await expect(page).toHaveURL(/\/student-portal$/);
    await expect(page.getByText("لا يوجد ملف طالب مرتبط بهذا الحساب حتى الآن.", { exact: false })).toBeVisible();
    await expect(page.getByText("LIVE · حساب الطالب", { exact: true })).toBeVisible();
    await expect(page.getByText("DEMO · حساب الطالب", { exact: true })).toHaveCount(0);
    await expect(page.getByText("روبوتكس مستوى 2", { exact: true })).toHaveCount(0);
    await expect(page.getByText("مستكشف الحلول", { exact: true })).toHaveCount(0);
  });

  test("R08 keeps linked children visible when invoices fail", async ({ page }) => {
    await page.route("**/api/v1/consumer/invoices", route => route.abort());
    await login(page, "parent", "+201000000011");
    await expect(page).toHaveURL(/\/family-portal$/);
    await expect(page.getByRole("heading", { name: "Youssef Ahmed", exact: true })).toBeVisible();
    await page.getByRole("button", { name: /^الفواتير/ }).click();
    await expect(page.getByRole("alert")).toContainText("تعذر تحميل الفواتير");
    await expect(page.getByRole("alert")).toContainText("إعادة المحاولة");
    await expect(page.getByRole("heading", { name: "Youssef Ahmed", exact: true })).toBeVisible();
    await expect(page.getByText("Lina Omar", { exact: true })).toHaveCount(0);
    await expect(page.getByText("LIVE · بيانات الحساب", { exact: true })).toBeVisible();
    await expect(page.getByText("DEMO · معاينة محلية", { exact: true })).toHaveCount(0);
  });

  test("R08 keeps linked children visible when sessions fail without a DEMO fallback", async ({ page }) => {
    await page.route("**/api/v1/consumer/me/sessions", route => route.abort());
    await login(page, "parent", "+201000000011");
    await expect(page).toHaveURL(/\/family-portal$/);
    await expect(page.getByRole("heading", { name: "Youssef Ahmed", exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("الجلسات غير متاحة مؤقتًا");
    await expect(page.getByText("LIVE · بيانات الحساب", { exact: true })).toBeVisible();
    await expect(page.getByText("DEMO · معاينة محلية", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Lina Omar", { exact: true })).toHaveCount(0);
  });

  test("R09 keeps the student profile visible when sessions fail", async ({ page }) => {
    await page.route("**/api/v1/consumer/me/sessions", route => route.abort());
    await login(page, "student", "+201000000012");
    await expect(page).toHaveURL(/\/student-portal$/);
    await expect(page.getByText("Lina Omar", { exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("الجلسات غير متاحة مؤقتًا");
    await expect(page.getByRole("status")).toContainText("إعادة المحاولة");
    await expect(page.getByText("Youssef Ahmed", { exact: true })).toHaveCount(0);
    await expect(page.getByText("LIVE · حساب الطالب", { exact: true })).toBeVisible();
    await expect(page.getByText("DEMO · حساب الطالب", { exact: true })).toHaveCount(0);
    await expect(page.getByText("روبوتكس مستوى 2", { exact: true })).toHaveCount(0);
    await expect(page.getByText("مستكشف الحلول", { exact: true })).toHaveCount(0);
  });

  test("R04 disables attendance mutations for a completed session", async ({ page }) => {
    await login(page, "staff", "+201000000010");
    await expect(page).toHaveURL(/\/instructor-desk$/);
    await expect(page.getByRole("heading", { name: "جلساتي وسير العمل", exact: true })).toBeVisible();

    await page.getByRole("button", { name: /الحضور/ }).click();
    const sessionSelect = page.locator("select").first();
    await expect(sessionSelect).toBeVisible();
    await sessionSelect.selectOption("50000000-0000-0000-0000-000000000003");
    await expect(page.getByRole("button", { name: "حفظ الحضور", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "إتمام الجلسة", exact: true })).toBeDisabled();
    await expect(page.getByLabel("حضور Youssef Ahmed")).toBeDisabled();
  });

  test("R04 preserves the live boundary when attendance loading fails", async ({ page }) => {
    await page.route("**/attendance", async route => {
      await new Promise(resolve => setTimeout(resolve, 750));
      await route.abort();
    });
    await login(page, "staff", "+201000000010");
    await expect(page).toHaveURL(/\/instructor-desk$/);
    await page.getByRole("button", { name: /الحضور/ }).click();
    await expect(page.getByText("جارٍ تحميل كشف الطلاب من الخادم…", { exact: true })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("تعذر تحميل أو حفظ بيانات الحضور");
    await expect(page.getByRole("alert")).toContainText("لم يتم عرض قائمة طلاب تجريبية");
    await expect(page.getByRole("button", { name: "إعادة المحاولة", exact: true })).toBeVisible();
  });
});


test.describe("route guards and session lifecycle", () => {
  test("anonymous users are redirected to login instead of seeing a DEMO operational surface", async ({ page }) => {
    await page.goto("/finance-desk");
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/student-portal");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("a parent cannot open the accountant surface", async ({ page }) => {
    await login(page, "parent", "+201000000011");
    await page.goto("/finance-desk");
    await expect(page).toHaveURL(/\/(finance-desk|login)$/);
    const forbidden = page.getByRole("heading", { name: "الوصول غير متاح" });
    if (await forbidden.count()) {
      await expect(forbidden).toBeVisible();
      await expect(page.getByText("هذه الشاشة خارج نطاق دورك")).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: "تسجيل الدخول" })).toBeVisible();
    }
  });

  test("student logout clears the session and returns to login", async ({ page }) => {
    await login(page, "student", "+201000000012");
    await expect(page).toHaveURL(/\/student-portal$/);
    await page.getByRole("button", { name: "تسجيل الخروج" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/student-portal");
    await expect(page).toHaveURL(/\/login$/);
  });
});
