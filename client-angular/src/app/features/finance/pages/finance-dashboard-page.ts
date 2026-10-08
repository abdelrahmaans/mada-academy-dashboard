import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthorizationService } from '../../../core/auth/authorization.service';
import { FinanceApiService } from '../data-access/finance-api.service';
import type { FinanceExpense, FinanceInvoice, FinanceReport } from '../models/finance.models';
import { MadaCard } from '../../../shared/components/card/mada-card';
import { MadaFeedbackState } from '../../../shared/components/feedback-state/mada-feedback-state';
import { MadaPageHeader } from '../../../shared/components/page-header/mada-page-header';
import { MadaScopeCard } from '../../../shared/components/scope-card/mada-scope-card';

@Component({
  selector: 'mada-finance-dashboard-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MadaCard, MadaFeedbackState, MadaPageHeader, MadaScopeCard],
  templateUrl: './finance-dashboard-page.html',
  styleUrl: './finance-dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceDashboardPage {
  readonly auth = inject(AuthService);
  readonly authorization = inject(AuthorizationService);
  private readonly api = inject(FinanceApiService);

  readonly invoices = signal<readonly FinanceInvoice[]>([]);
  readonly expenses = signal<readonly FinanceExpense[]>([]);
  readonly report = signal<FinanceReport | null>(null);
  readonly invoicesLoading = signal(true);
  readonly expensesLoading = signal(true);
  readonly reportLoading = signal(true);
  readonly invoicesError = signal<string | null>(null);
  readonly expensesError = signal<string | null>(null);
  readonly reportError = signal<string | null>(null);
  readonly query = signal('');
  readonly branchName = computed(() => this.auth.me()?.branches?.find((branch) => branch.id === this.auth.me()?.branchId)?.name ?? 'النطاق المالي المصرح به');
  readonly displayName = computed(() => this.auth.me()?.user?.displayName?.trim() || 'المستخدم المالي');
  readonly filteredInvoices = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('ar-EG');
    if (!query) return this.invoices();
    return this.invoices().filter((invoice) => `${invoice.invoiceNumber} ${invoice.studentName ?? ''}`.toLocaleLowerCase('ar-EG').includes(query));
  });
  readonly totalOutstanding = computed(() => this.invoices().reduce((sum, invoice) => sum + invoice.remainingPiastres, 0));

  constructor() {
    this.load();
  }

  load(): void {
    this.loadInvoices();
    this.loadExpenses();
    this.loadReport();
  }

  loadInvoices(): void {
    this.invoicesLoading.set(true);
    this.invoicesError.set(null);
    this.api.listInvoices().pipe(finalize(() => this.invoicesLoading.set(false))).subscribe({
      next: (items) => this.invoices.set(items),
      error: (error: unknown) => this.invoicesError.set(toMessage(error, 'تعذر تحميل فواتير النطاق المالي.')),
    });
  }

  loadExpenses(): void {
    this.expensesLoading.set(true);
    this.expensesError.set(null);
    this.api.listExpenses().pipe(finalize(() => this.expensesLoading.set(false))).subscribe({
      next: (items) => this.expenses.set(items),
      error: (error: unknown) => this.expensesError.set(toMessage(error, 'تعذر تحميل مصروفات النطاق المالي.')),
    });
  }

  loadReport(): void {
    this.reportLoading.set(true);
    this.reportError.set(null);
    this.api.getReport().pipe(finalize(() => this.reportLoading.set(false))).subscribe({
      next: (report) => this.report.set(report),
      error: (error: unknown) => this.reportError.set(toMessage(error, 'تعذر تحميل ملخص التقرير المالي.')),
    });
  }
}

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
