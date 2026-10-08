import { Component, input, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import ar from '@angular/common/locales/ar';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthorizationService } from '../../../core/auth/authorization.service';
import { FinanceApiService } from '../data-access/finance-api.service';
import type { FinanceInvoice, FinanceReport } from '../models/finance.models';
import { FinanceDashboardPage } from './finance-dashboard-page';
import { MadaCard } from '../../../shared/components/card/mada-card';
import { MadaFeedbackState } from '../../../shared/components/feedback-state/mada-feedback-state';
import { MadaPageHeader } from '../../../shared/components/page-header/mada-page-header';

registerLocaleData(ar);

@Component({ selector: 'mada-scope-card', standalone: true, template: '<span>{{ scopeName() }}</span>' })
class StubScopeCard {
  readonly level = input<string>();
  readonly scopeName = input('');
  readonly tenantName = input<string | null>(null);
}

const report: FinanceReport = {
  from: null,
  to: null,
  totalBilledPiastres: 10000,
  totalCollectedPiastres: 4000,
  totalOutstandingPiastres: 6000,
  approvedExpensesPiastres: 1000,
  netPiastres: 3000,
  branches: [],
};

const invoice = {
  id: 'invoice-1', invoiceNumber: 'MAD-0001', tenantId: 'tenant-1', branchId: 'branch-1', studentId: 'student-1', studentName: 'طالب الاختبار',
  issueDate: '2026-10-08', dueDate: '2026-10-15', totalPiastres: 5000, paidPiastres: 0, remainingPiastres: 5000, status: 'ISSUED', lines: [], payments: [],
} as FinanceInvoice;

function setup(api: Partial<FinanceApiService>) {
  TestBed.configureTestingModule({
    imports: [FinanceDashboardPage],
    providers: [
      { provide: AuthService, useValue: { me: signal({ role: 'R06_ACCOUNTANT', branchId: 'branch-1', branches: [{ id: 'branch-1', name: 'مدينة نصر' }], academy: { name: 'أكاديمية مدى' }, user: { displayName: 'محاسب' } }) } },
      { provide: AuthorizationService, useValue: { hasRole: () => true } },
      { provide: FinanceApiService, useValue: api },
    ],
  });
  TestBed.overrideComponent(FinanceDashboardPage, {
    set: { imports: [CommonModule, FormsModule, CurrencyPipe, MadaCard, MadaFeedbackState, MadaPageHeader, StubScopeCard] },
  });
  const fixture = TestBed.createComponent(FinanceDashboardPage);
  fixture.detectChanges();
  return fixture;
}

describe('FinanceDashboardPage', () => {
  it('renders independent live read sections when all requests succeed', () => {
    const fixture = setup({ listStudents: () => of([]), listInvoices: () => of([]), listExpenses: () => of([]), getReport: () => of(report) });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('LIVE');
    expect(fixture.nativeElement.textContent).toContain('لا توجد فواتير');
    expect(fixture.nativeElement.textContent).toContain('المحصّل');
  });

  it('keeps report data visible when invoice loading fails', () => {
    const fixture = setup({ listStudents: () => of([]), listInvoices: () => throwError(() => new Error('فشل الفواتير')), listExpenses: () => of([]), getReport: () => of(report) });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('فشل الفواتير');
    expect(fixture.nativeElement.textContent).toContain('40');
    expect(fixture.nativeElement.textContent).not.toContain('تعذر تحميل ملخص التقرير المالي');
  });

  it('keeps payment inputs after failure and prevents duplicate in-flight submissions', () => {
    const paymentResult = new Subject<never>();
    let calls = 0;
    const fixture = setup({ listStudents: () => of([]), listInvoices: () => of([invoice]), listExpenses: () => of([]), getReport: () => of(report), createPayment: () => { calls += 1; return paymentResult.asObservable(); } });
    const page = fixture.componentInstance;
    page.selectInvoice(invoice.id);
    page.paymentAmount.set('10.00');
    page.paymentReceivedOn.set('2026-10-08');
    page.createPayment();
    page.createPayment();
    expect(calls).toBe(1);
    expect(page.paymentSubmitting()).toBe(true);
    paymentResult.error(new Error('فشل التسجيل'));
    expect(page.paymentSubmitting()).toBe(false);
    expect(page.paymentAmount()).toBe('10.00');
    expect(page.actionError()).toBe('فشل التسجيل');
  });

  it('releases evidence pending state and preserves the recorded payment when upload fails', () => {
    const uploadResult = new Subject<never>();
    const payment = { id: 'payment-1', invoiceId: invoice.id, amountPiastres: 1000, method: 'VISA', receivedOn: '2026-10-08', createdAt: '2026-10-08', evidenceStatus: 'MISSING' };
    const fixture = setup({ listStudents: () => of([]), listInvoices: () => of([{ ...invoice, payments: [payment] }]), listExpenses: () => of([]), getReport: () => of(report), uploadPaymentEvidence: () => uploadResult.asObservable() });
    const page = fixture.componentInstance;
    page.uploadEvidence({ target: { files: [new File(['receipt'], 'receipt.png', { type: 'image/png' })] } } as unknown as Event, payment);
    expect(page.paymentEvidenceLoading()).toBe('payment-1');
    uploadResult.error(new Error('التخزين غير متاح'));
    expect(page.paymentEvidenceLoading()).toBeNull();
    expect(page.actionError()).toBe('التخزين غير متاح');
    expect(page.invoices()[0].payments[0].id).toBe('payment-1');
  });
});
