import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FinanceDeskDialogs } from "./FinanceDeskDialogs";
import { Collections, Expenses } from "./FinanceDeskViews";
import type { Expense, Invoice } from "@/pages/FinanceDesk";
import type { StudentRecord } from "@/lib/apiClient";

const noop = () => undefined;

const paymentInvoice: Invoice = {
  id: "invoice-1",
  number: "MAD-2026-1",
  student: "طالب تجريبي",
  parent: "ولي الأمر",
  branch: "مدينة نصر",
  course: "روبوتكس",
  total: 100,
  collected: 25,
  due: "2026-10-12",
  payments: [
    {
      id: "payment-1",
      invoiceId: "invoice-1",
      amountPiastres: 2500,
      method: "VISA",
      receivedOn: "2026-10-01",
      createdAt: "2026-10-01T00:00:00Z",
      evidenceStatus: "NOT_ATTACHED",
    },
  ],
};

const pendingExpense: Expense = {
  id: "expense-1",
  description: "صيانة معمل",
  branch: "مدينة نصر",
  category: "تشغيل وصيانة",
  amount: 350,
  date: "2026-10-01",
  status: "pending",
  createdBy: "المحاسب",
};

const student: StudentRecord = {
  id: "student-1",
  branchId: "branch-1",
  fullName: "طالب تجريبي",
  dateOfBirth: null,
  status: "ACTIVE",
  activeEnrollmentCount: 1,
};

function renderCollections(
  overrides: Partial<ComponentProps<typeof Collections>> = {}
) {
  return renderToStaticMarkup(
    createElement(Collections, {
      invoices: [paymentInvoice],
      query: "",
      setQuery: noop,
      paymentInvoice: paymentInvoice.id,
      setPaymentInvoice: noop,
      amount: "25",
      setAmount: noop,
      submitting: false,
      evidenceUploadingIds: new Set<string>(),
      onSubmit: event => event.preventDefault(),
      onCreateInvoice: noop,
      onUploadEvidence: noop,
      onDownloadEvidence: noop,
      paymentMethod: "CASH",
      setPaymentMethod: noop,
      receivedOn: "2026-10-01",
      setReceivedOn: noop,
      externalReference: "",
      setExternalReference: noop,
      roleCode: "R06_ACCOUNTANT",
      ...overrides,
    })
  );
}

function renderExpenses(
  overrides: Partial<ComponentProps<typeof Expenses>> = {}
) {
  return renderToStaticMarkup(
    createElement(Expenses, {
      expenses: [pendingExpense],
      query: "",
      setQuery: noop,
      description: "صيانة",
      setDescription: noop,
      amount: "350",
      setAmount: noop,
      branch: "مدينة نصر",
      setBranch: noop,
      onSubmit: event => event.preventDefault(),
      onReject: noop,
      onApprove: noop,
      onUploadEvidence: noop,
      onDownloadEvidence: noop,
      liveMode: true,
      submitting: false,
      decisionSubmitting: null,
      evidenceUploadingIds: new Set<string>(),
      ...overrides,
    })
  );
}

describe("Finance mutation loading and disabled states", () => {
  it("locks payment fields and shows progress while recording a payment", () => {
    const markup = renderCollections({ submitting: true });

    expect(markup).toContain("جارٍ تسجيل التحصيل…");
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('class="finance-desk-primary" type="submit" disabled=""');
    expect(markup).toContain('<select disabled=""');
    expect(markup).toContain('<input disabled=""');
  });

  it("disables only the payment evidence input currently uploading", () => {
    const markup = renderCollections({
      evidenceUploadingIds: new Set(["payment:payment-1"]),
    });

    expect(markup).toContain("جارٍ رفع إثبات الدفع…");
    expect(markup).toContain('aria-disabled="true"');
    expect(markup).toContain('type="file" accept="application/pdf,image/jpeg,image/png" hidden="" disabled="" aria-busy="true"');
  });

  it("locks invoice creation and rejection dialogs while their requests are pending", () => {
    const markup = renderToStaticMarkup(
      createElement(FinanceDeskDialogs, {
        invoiceDialogOpen: true,
        setInvoiceDialogOpen: noop,
        invoiceStudentId: student.id,
        setInvoiceStudentId: noop,
        students: [student],
        invoiceDescription: "رسوم شهرية",
        setInvoiceDescription: noop,
        invoiceAmount: "1200",
        setInvoiceAmount: noop,
        invoiceDueDate: "2026-10-12",
        setInvoiceDueDate: noop,
        invoiceSubmitting: true,
        createInvoice: event => event.preventDefault(),
        rejecting: pendingExpense.id,
        setRejecting: noop,
        rejectReason: "سبب موثق",
        setRejectReason: noop,
        rejectSubmitting: true,
        rejectExpense: event => event.preventDefault(),
        liveMode: true,
        workspaceState: "ready",
      })
    );

    expect(markup).toContain("جارٍ إنشاء الفاتورة…");
    expect(markup).toContain("جارٍ حفظ الرفض…");
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-label="إغلاق نافذة إنشاء الفاتورة" disabled=""');
    expect(markup).toContain('id="reject-expense-reason" disabled=""');
  });

  it("locks expense creation and decisions while showing the active action", () => {
    const markup = renderExpenses({
      submitting: true,
      decisionSubmitting: { expenseId: pendingExpense.id, action: "approve" },
      evidenceUploadingIds: new Set([`expense:${pendingExpense.id}`]),
    });

    expect(markup).toContain("جارٍ رفع المصروف…");
    expect(markup).toContain("جارٍ الاعتماد…");
    expect(markup).toContain("جارٍ رفع الإثبات…");
    expect(markup).toContain('class="finance-desk-primary" type="submit" disabled="" aria-busy="true"');
    expect(markup).toContain('class="finance-reject-link" disabled="" aria-busy="true"');
    expect(markup).toContain('type="file" accept="application/pdf,image/jpeg,image/png" hidden="" disabled="" aria-busy="true"');
  });
});
