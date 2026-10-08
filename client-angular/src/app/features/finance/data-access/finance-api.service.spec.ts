import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FinanceApiService } from './finance-api.service';

describe('FinanceApiService', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    return { api: TestBed.inject(FinanceApiService), http: TestBed.inject(HttpTestingController) };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('loads invoices without allowing client-selected branch or tenant scope', () => {
    const { api, http } = setup();
    api.listInvoices('سارة').subscribe((items) => expect(items).toEqual([]));
    const request = http.expectOne((candidate) => candidate.urlWithParams.includes('/api/v1/finance/invoices?query='));
    expect(request.request.urlWithParams).toContain('query=%D8%B3%D8%A7%D8%B1%D8%A9');
    expect(request.request.urlWithParams).not.toContain('branchId');
    expect(request.request.urlWithParams).not.toContain('tenantId');
    expect(request.request.method).toBe('GET');
    request.flush({ data: { items: [], total: 0 } });
  });

  it('loads expenses and report with the correct endpoint policies', () => {
    const { api, http } = setup();
    api.listExpenses().subscribe((items) => expect(items).toEqual([]));
    api.getReport().subscribe((report) => expect(report.totalBilledPiastres).toBe(0));
    const expenses = http.expectOne((request) => request.urlWithParams.endsWith('/api/v1/finance/expenses?status=ALL'));
    const report = http.expectOne((request) => request.urlWithParams.endsWith('/api/v1/finance/reports/summary'));
    expect(expenses.request.method).toBe('GET');
    expect(report.request.method).toBe('GET');
    expenses.flush({ data: { items: [], total: 0 } });
    report.flush({ data: { from: null, to: null, totalBilledPiastres: 0, totalCollectedPiastres: 0, totalOutstandingPiastres: 0, approvedExpensesPiastres: 0, netPiastres: 0, branches: [] } });
  });

  it('sends mutation payloads without tenant or branch selectors', () => {
    const { api, http } = setup();
    api.createInvoice({ studentId: 'student-1', dueDate: '2026-10-20', lines: [{ description: 'اشتراك', amountPiastres: 10000 }] }).subscribe();
    api.createPayment('invoice-1', { amountPiastres: 5000, method: 'CASH', receivedOn: '2026-10-08' }).subscribe();
    api.createExpense({ description: 'مستلزمات', category: 'OPERATIONS', amountPiastres: 2500 }).subscribe();
    const invoice = http.expectOne((request) => request.urlWithParams.endsWith('/api/v1/finance/invoices'));
    const payment = http.expectOne((request) => request.urlWithParams.endsWith('/api/v1/finance/invoices/invoice-1/payments'));
    const expense = http.expectOne((request) => request.urlWithParams.endsWith('/api/v1/finance/expenses'));
    expect(invoice.request.method).toBe('POST');
    expect(payment.request.method).toBe('POST');
    expect(expense.request.method).toBe('POST');
    expect(invoice.request.body).not.toHaveProperty('branchId');
    expect(payment.request.body).not.toHaveProperty('tenantId');
    expect(expense.request.body).not.toHaveProperty('branchId');
    invoice.flush({ data: {} }); payment.flush({ data: { payment: {}, invoiceId: 'invoice-1' } }); expense.flush({ data: {} });
  });

  it('uses multipart form data for payment evidence and supports expense decisions', () => {
    const { api, http } = setup();
    api.uploadPaymentEvidence('payment-1', new File(['png'], 'receipt.png', { type: 'image/png' })).subscribe();
    api.decideExpense('expense-1', 'approve', 'تمت المراجعة').subscribe();
    const evidence = http.expectOne((request) => request.urlWithParams.endsWith('/api/v1/finance/payments/payment-1/evidence'));
    const decision = http.expectOne((request) => request.urlWithParams.endsWith('/api/v1/finance/expenses/expense-1/approve'));
    expect(evidence.request.method).toBe('POST');
    expect(evidence.request.body).toBeInstanceOf(FormData);
    expect(decision.request.body).toEqual({ reason: 'تمت المراجعة' });
    evidence.flush({ data: { paymentId: 'payment-1', status: 'ATTACHED', fileName: 'receipt.png', contentType: 'image/png', sizeBytes: 3 } });
    decision.flush({ data: {} });
  });
});
