import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, accountType: "staff" | "parent" | "student", phone: string) {
  await page.goto("/login");
  await page.getByLabel("نوع الحساب").selectOption(accountType);
  await page.getByLabel("رقم الهاتف").fill(phone);
  await page.getByLabel("كلمة المرور").fill("Mada@2026");
  await page.getByRole("button", { name: /دخول إلى المساحة/ }).click();
}

test.describe("critical local MVP journeys", () => {
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
