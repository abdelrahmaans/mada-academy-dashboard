import { Component, input, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import ar from '@angular/common/locales/ar';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthorizationService } from '../../../core/auth/authorization.service';
import { FinanceApiService } from '../data-access/finance-api.service';
import type { FinanceReport } from '../models/finance.models';
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
});
