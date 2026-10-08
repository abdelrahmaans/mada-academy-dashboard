import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthorizationService } from '../../../core/auth/authorization.service';
import { FinanceApiService } from '../data-access/finance-api.service';
import { buildExpenseInput, buildInvoiceInput, buildPaymentInput, SingleFlightGuard } from '../data-access/finance-mutations';
import type { FinanceExpense, FinanceInvoice, FinancePayment, FinanceReport, FinanceStudent } from '../models/finance.models';
import { MadaCard } from '../../../shared/components/card/mada-card';
import { MadaFeedbackState } from '../../../shared/components/feedback-state/mada-feedback-state';
import { MadaPageHeader } from '../../../shared/components/page-header/mada-page-header';
import { MadaScopeCard } from '../../../shared/components/scope-card/mada-scope-card';

@Component({
  selector: 'mada-finance-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, MadaCard, MadaFeedbackState, MadaPageHeader, MadaScopeCard],
  templateUrl: './finance-dashboard-page.html',
  styleUrl: './finance-dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceDashboardPage {
  readonly auth = inject(AuthService);
  readonly authorization = inject(AuthorizationService);
  private readonly api = inject(FinanceApiService);
  private readonly invoiceGuard = new SingleFlightGuard();
  private readonly paymentGuard = new SingleFlightGuard();
  private readonly expenseGuard = new SingleFlightGuard();
  private readonly decisionGuard = new SingleFlightGuard();
  private readonly evidenceGuards = new Map<string, SingleFlightGuard>();

  readonly invoices = signal<readonly FinanceInvoice[]>([]);
  readonly expenses = signal<readonly FinanceExpense[]>([]);
  readonly students = signal<readonly FinanceStudent[]>([]);
  readonly report = signal<FinanceReport | null>(null);
  readonly invoicesLoading = signal(true);
  readonly expensesLoading = signal(true);
  readonly studentsLoading = signal(true);
  readonly reportLoading = signal(true);
  readonly invoicesError = signal<string | null>(null);
  readonly expensesError = signal<string | null>(null);
  readonly studentsError = signal<string | null>(null);
  readonly reportError = signal<string | null>(null);
  readonly query = signal('');
  readonly selectedInvoiceId = signal<string | null>(null);
  readonly selectedPaymentId = signal<string | null>(null);
  readonly paymentEvidenceLoading = signal<string | null>(null);
  readonly invoiceSubmitting = signal(false);
  readonly paymentSubmitting = signal(false);
  readonly expenseSubmitting = signal(false);
  readonly decisionSubmitting = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly invoiceStudentId = signal('');
  readonly invoiceDescription = signal('');
  readonly invoiceAmount = signal('');
  readonly invoiceDueDate = signal(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  readonly paymentAmount = signal('');
  readonly paymentMethod = signal<'CASH' | 'VISA' | 'INSTAPAY' | 'VODAFONE_CASH'>('CASH');
  readonly paymentReceivedOn = signal(new Date().toISOString().slice(0, 10));
  readonly paymentReference = signal('');
  readonly paymentNote = signal('');
  readonly expenseDescription = signal('');
  readonly expenseAmount = signal('');
  readonly expenseSpentOn = signal(new Date().toISOString().slice(0, 10));

  readonly branchName = computed(() => this.auth.me()?.branches?.find((branch) => branch.id === this.auth.me()?.branchId)?.name ?? 'النطاق المالي المصرح به');
  readonly displayName = computed(() => this.auth.me()?.user?.displayName?.trim() || 'المستخدم المالي');
  readonly filteredInvoices = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('ar-EG');
    if (!query) return this.invoices();
    return this.invoices().filter((invoice) => `${invoice.invoiceNumber} ${invoice.studentName ?? ''}`.toLocaleLowerCase('ar-EG').includes(query));
  });
  readonly selectedInvoice = computed(() => this.invoices().find((invoice) => invoice.id === this.selectedInvoiceId()) ?? null);
  readonly selectedRemaining = computed(() => this.selectedInvoice()?.remainingPiastres ?? 0);
  readonly totalOutstanding = computed(() => this.invoices().reduce((sum, invoice) => sum + invoice.remainingPiastres, 0));

  constructor() { this.load(); }

  load(): void { this.loadInvoices(); this.loadExpenses(); this.loadReport(); this.loadStudents(); }
  loadStudents(): void {
    this.studentsLoading.set(true); this.studentsError.set(null);
    this.api.listStudents().pipe(finalize(() => this.studentsLoading.set(false))).subscribe({
      next: (items) => { this.students.set(items); if (!this.invoiceStudentId() && items[0]) this.invoiceStudentId.set(items[0].id); },
      error: (error: unknown) => this.studentsError.set(toMessage(error, 'تعذر تحميل طلاب النطاق المالي.')),
    });
  }
  loadInvoices(): void {
    this.invoicesLoading.set(true); this.invoicesError.set(null);
    this.api.listInvoices().pipe(finalize(() => this.invoicesLoading.set(false))).subscribe({
      next: (items) => this.invoices.set(items),
      error: (error: unknown) => this.invoicesError.set(toMessage(error, 'تعذر تحميل فواتير النطاق المالي.')),
    });
  }
  loadExpenses(): void {
    this.expensesLoading.set(true); this.expensesError.set(null);
    this.api.listExpenses().pipe(finalize(() => this.expensesLoading.set(false))).subscribe({
      next: (items) => this.expenses.set(items),
      error: (error: unknown) => this.expensesError.set(toMessage(error, 'تعذر تحميل مصروفات النطاق المالي.')),
    });
  }
  loadReport(): void {
    this.reportLoading.set(true); this.reportError.set(null);
    this.api.getReport().pipe(finalize(() => this.reportLoading.set(false))).subscribe({
      next: (value) => this.report.set(value),
      error: (error: unknown) => this.reportError.set(toMessage(error, 'تعذر تحميل ملخص التقرير المالي.')),
    });
  }

  createInvoice(): void {
    const input = buildInvoiceInput(this.invoiceStudentId(), this.invoiceDescription(), this.invoiceAmount(), this.invoiceDueDate());
    if (!input) { this.actionError.set('تحقق من الطالب والوصف والمبلغ وتاريخ الاستحقاق.'); return; }
    if (!this.invoiceGuard.tryAcquire()) return;
    this.invoiceSubmitting.set(true); this.clearAction();
    this.api.createInvoice(input).pipe(finalize(() => { this.invoiceGuard.release(); this.invoiceSubmitting.set(false); })).subscribe({
      next: (invoice) => { this.actionMessage.set(`تم إنشاء الفاتورة ${invoice.invoiceNumber}.`); this.invoiceDescription.set(''); this.invoiceAmount.set(''); this.loadInvoices(); },
      error: (error: unknown) => this.actionError.set(toMessage(error, 'تعذر إنشاء الفاتورة.')),
    });
  }

  selectInvoice(invoiceId: string): void { this.selectedInvoiceId.set(invoiceId); this.selectedPaymentId.set(null); this.clearAction(); }
  createPayment(): void {
    const invoice = this.selectedInvoice();
    const input = invoice ? buildPaymentInput(this.paymentAmount(), invoice.remainingPiastres, this.paymentMethod(), this.paymentReceivedOn(), this.paymentReference(), this.paymentNote()) : null;
    if (!invoice || !input) { this.actionError.set('اختر فاتورة وتحقق من المبلغ والتاريخ والمرجع المطلوب.'); return; }
    if (!this.paymentGuard.tryAcquire()) return;
    this.paymentSubmitting.set(true); this.clearAction();
    this.api.createPayment(invoice.id, input).pipe(finalize(() => { this.paymentGuard.release(); this.paymentSubmitting.set(false); })).subscribe({
      next: (result) => { this.selectedPaymentId.set(result.payment.id); this.actionMessage.set('تم تسجيل الدفعة. يمكن رفع الإثبات الآن بشكل منفصل.'); this.paymentAmount.set(''); this.paymentReference.set(''); this.paymentNote.set(''); this.loadInvoices(); },
      error: (error: unknown) => this.actionError.set(toMessage(error, 'تعذر تسجيل الدفعة.')),
    });
  }

  uploadEvidence(event: Event, payment: FinancePayment): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    let guard = this.evidenceGuards.get(payment.id);
    if (!guard) { guard = new SingleFlightGuard(); this.evidenceGuards.set(payment.id, guard); }
    if (!guard.tryAcquire()) return;
    this.paymentEvidenceLoading.set(payment.id); this.clearAction();
    this.api.uploadPaymentEvidence(payment.id, file).pipe(finalize(() => { guard?.release(); this.paymentEvidenceLoading.set(null); })).subscribe({
      next: () => { this.actionMessage.set('تم إرفاق إثبات الدفع بنجاح.'); this.loadInvoices(); },
      error: (error: unknown) => this.actionError.set(toMessage(error, 'تعذر رفع إثبات الدفع.')),
    });
  }

  createExpense(): void {
    const input = buildExpenseInput(this.expenseDescription(), this.expenseAmount(), this.expenseSpentOn());
    if (!input) { this.actionError.set('تحقق من وصف المصروف والمبلغ.'); return; }
    if (!this.expenseGuard.tryAcquire()) return;
    this.expenseSubmitting.set(true); this.clearAction();
    this.api.createExpense(input).pipe(finalize(() => { this.expenseGuard.release(); this.expenseSubmitting.set(false); })).subscribe({
      next: () => { this.actionMessage.set('تم تسجيل المصروف في حالة انتظار الاعتماد.'); this.expenseDescription.set(''); this.expenseAmount.set(''); this.loadExpenses(); },
      error: (error: unknown) => this.actionError.set(toMessage(error, 'تعذر تسجيل المصروف.')),
    });
  }

  decideExpense(expense: FinanceExpense, decision: 'approve' | 'reject'): void {
    const reason = window.prompt(decision === 'approve' ? 'اكتب سبب الاعتماد' : 'اكتب سبب الرفض')?.trim() ?? '';
    if (!reason) { this.actionError.set('سبب القرار مطلوب للتدقيق.'); return; }
    if (!this.decisionGuard.tryAcquire()) return;
    this.decisionSubmitting.set(expense.id); this.clearAction();
    this.api.decideExpense(expense.id, decision, reason).pipe(finalize(() => { this.decisionGuard.release(); this.decisionSubmitting.set(null); })).subscribe({
      next: () => { this.actionMessage.set(decision === 'approve' ? 'تم اعتماد المصروف.' : 'تم رفض المصروف.'); this.loadExpenses(); this.loadReport(); },
      error: (error: unknown) => this.actionError.set(toMessage(error, 'تعذر تنفيذ قرار المصروف.')),
    });
  }

  clearAction(): void { this.actionMessage.set(null); this.actionError.set(null); }
}

function toMessage(error: unknown, fallback: string): string { return error instanceof Error && error.message ? error.message : fallback; }
