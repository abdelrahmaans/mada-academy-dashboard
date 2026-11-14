import { expect, test, type Page } from "@playwright/test";

async function loginStaff(page: Page, phone: string) {
  page.on("console", msg => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", err => console.log("PAGE ERROR:", err.message));
  page.on("requestfailed", req => console.log("REQ FAILED:", req.url(), req.failure()?.errorText));
  page.on("response", res => {
    if (res.url().includes("/auth/") || res.status() >= 400) {
      console.log("RESPONSE:", res.url(), res.status());
    }
  });
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");
  await page.locator("#login-account-type").selectOption("staff");
  await page.locator("#login-phone").fill(phone);
  await page.locator("#login-password").fill("Mada@2026");
  await page.locator("button.auth-login-primary").click();
  await page.waitForTimeout(3000);
  console.log("CURRENT URL AFTER LOGIN:", page.url());
}

test.describe("Comprehensive Multi-Role Interactive UX & Functional Audit", () => {
  test("R07 Marketing Desk: Leads pipeline, Interview Modal, Content Agenda, and Support Ticket", async ({ page }) => {
    await loginStaff(page, "+201000000007");
    await page.goto("/marketing-desk");
    await page.waitForLoadState("networkidle");

    // Check KPIs
    const kpis = page.locator(".marketing-kpi-grid");
    await expect(kpis).toBeVisible({ timeout: 10000 });

    // Check Leads pipeline search & tabs
    const branchCards = page.locator(".marketing-branch-card");
    expect(await branchCards.count()).toBeGreaterThanOrEqual(1);

    // Test clicking "حجز مقابلة" opens the new custom ScheduleInterviewModal
    const interviewBtn = page.locator(".lead-action-btn.highlight").first();
    if (await interviewBtn.isVisible()) {
      await interviewBtn.click();
      const modalHeader = page.locator("h3:has-text('حجز موعد مقابلة واختبار تحديد مستوى')");
      await expect(modalHeader).toBeVisible({ timeout: 5000 });

      // Verify date picker and time selection
      const dateInput = page.locator(".marketing-modal-form input[type='date']");
      await expect(dateInput).toBeVisible();

      // Close modal
      const closeBtn = page.locator(".marketing-modal-close");
      await closeBtn.click();
      await expect(modalHeader).not.toBeVisible();
    }

    // Switch to Content Agenda tab
    const agendaTab = page.locator(".marketing-nav-tab:has-text('أجندة المحتوى')");
    await agendaTab.click();
    const contentGrid = page.locator(".marketing-notes-grid");
    await expect(contentGrid).toBeVisible({ timeout: 5000 });

    // Test Quick Support Ticket Modal target recipient
    const ticketBtn = page.locator("button:has-text('تسجيل تذكرة دعم')");
    if (await ticketBtn.isVisible()) {
      await ticketBtn.click();
      const targetBadge = page.locator("text=مدير الفرع المباشر (Branch Manager - R02)");
      await expect(targetBadge).toBeVisible({ timeout: 5000 });
      await page.locator("button:has-text('إلغاء')").click();
    }
  });

  test("R05 Secretary Desk: Quick Date Navigation, Attendance Roster, Students Intake & Details Modal", async ({ page }) => {
    await loginStaff(page, "+201000000005");
    await page.goto("/secretary-desk");
    await page.waitForLoadState("networkidle");

    // Test Quick Date Pills
    const todayPill = page.locator(".pulse-quick-pill:has-text('اليوم')");
    const tomorrowPill = page.locator(".pulse-quick-pill:has-text('غداً')");
    await expect(todayPill).toBeVisible({ timeout: 8000 });
    await expect(tomorrowPill).toBeVisible();

    // Click Tomorrow pill
    await tomorrowPill.click();
    await expect(tomorrowPill).toHaveClass(/active/);

    // Return to Today
    await todayPill.click();
    await expect(todayPill).toHaveClass(/active/);

    // Test Secretary Instant Student Registration Tab
    const regTab = page.getByRole("tab", { name: /تسجيل طالب فوري/ }).or(page.locator("button:has-text('تسجيل طالب فوري')"));
    if (await regTab.isVisible()) {
      await regTab.click();
      const studentNameInput = page.locator("input[placeholder*='يوسف حسام']");
      await expect(studentNameInput).toBeVisible({ timeout: 5000 });
    }

    // Go to /students and check "طلاب جدد محولون من التسويق"
    await page.goto("/students");
    await page.waitForLoadState("networkidle");
    const intakeTab = page.locator("button:has-text('طلاب جدد محولون من التسويق')");
    await expect(intakeTab).toBeVisible({ timeout: 8000 });

    // Open Student Details Modal and verify isolated scroll
    const firstStudentBtn = page.locator("button.student-identity").first();
    if (await firstStudentBtn.isVisible()) {
      await firstStudentBtn.click();
      const studentModal = page.locator(".student-details-dialog");
      await expect(studentModal).toBeVisible({ timeout: 5000 });

      // Verify close button
      const closeBtn = page.locator(".student-details-dialog .icon-button[aria-label='إغلاق']");
      await closeBtn.click();
      await expect(studentModal).not.toBeVisible();
    }
  });

  test("R06 Accountant Desk: Humanized codes, Shift closeout review, and Payroll slips", async ({ page }) => {
    await loginStaff(page, "+201000000006");
    await page.goto("/finance-desk");
    await page.waitForLoadState("networkidle");

    // Check Payroll codes
    const payrollSubnav = page.locator("button:has-text('المسيرات وحصص المدربين')").or(page.locator("a[href='#payroll']"));
    if (await payrollSubnav.isVisible()) {
      await payrollSubnav.click();
      await page.waitForTimeout(500);
      const payrollTable = page.locator(".finance-desk-table");
      await expect(payrollTable).toBeVisible({ timeout: 5000 });

      // Ensure no raw UUIDs like 99000000-...
      const rawUuid = page.locator("text=/99000000-0000-0000-0000-00000000000/").first();
      expect(await rawUuid.isVisible()).toBeFalsy();
    }

    // Check Shifts view
    const shiftsSubnav = page.locator("button:has-text('تقفيل ومطابقة الخزينة')").or(page.locator("a[href='#shifts']"));
    if (await shiftsSubnav.isVisible()) {
      await shiftsSubnav.click();
      await page.waitForTimeout(500);
      // Verify clean shift code
      const shiftCode = page.locator("text=/وردية #/").first();
      await expect(shiftCode).toBeVisible({ timeout: 5000 });
    }
  });

  test("R02 Branch Manager: Humanized group codes, Supervisor assignment link, and Competitions", async ({ page }) => {
    await loginStaff(page, "+201000000003");
    await page.goto("/classes");
    await page.waitForLoadState("networkidle");

    // Check that groups do not show raw UUID 40000000-...
    const rawGroupUuid = page.locator("text=40000000-0000-0000-0000-000000000001");
    expect(await rawGroupUuid.isVisible()).toBeFalsy();

    // Check link to supervision assignments
    const supervisionLink = page.locator("a:has-text('إسناد الإشراف الأكاديمي ↗')");
    await expect(supervisionLink).toBeVisible({ timeout: 8000 });

    // Open a group details dialog
    const groupRow = page.locator(".classes-table tbody tr").first();
    if (await groupRow.isVisible()) {
      await groupRow.click();
      const supervisorAction = page.locator("text=إسناد / تغيير ⚙️");
      await expect(supervisorAction).toBeVisible({ timeout: 5000 });
      await page.locator(".academic-modal-header button[aria-label='إغلاق']").click();
    }

    // Check Competitions
    await page.goto("/competitions");
    await page.waitForLoadState("networkidle");
    const compHeader = page.locator("h1:has-text('معسكرات البطولات ولوحة الشرف الذهبية')");
    await expect(compHeader).toBeVisible({ timeout: 8000 });
  });

  test("R04 Coach Desk: Personal Sessions & Dynamic Supervision Tab", async ({ page }) => {
    await loginStaff(page, "+201000000010");
    await page.goto("/instructor-desk");
    await page.waitForLoadState("networkidle");

    const tabs = page.locator(".r04-live-tabs");
    await expect(tabs).toBeVisible({ timeout: 8000 });
    const mySessionsTab = page.locator(".r04-live-tabs button:has-text('حصصي')");
    await expect(mySessionsTab).toBeVisible();
  });

  test("R01 Academy Owner: Executive dashboard & Multi-branch overview", async ({ page }) => {
    await loginStaff(page, "+201000000002");
    await page.goto("/executive-dashboard");
    await page.waitForLoadState("networkidle");

    const header = page.locator("h1:has-text('لوحة الإدارة التنفيذية')").or(page.locator(".r1-title"));
    await expect(header).toBeVisible({ timeout: 8000 });
  });
});
