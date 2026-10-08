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
});
