import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiEnvelope } from '../../../core/auth/auth.models';
import { ENDPOINT_POLICY } from '../../../core/http/endpoint-policy.interceptor';
import type {
  FinanceEvidenceResult,
  FinanceExpense,
  FinanceExpenseInput,
  FinanceInvoice,
  FinanceInvoiceInput,
  FinancePaymentInput,
  FinancePaymentResult,
  FinanceReport,
  FinanceStudent,
} from '../models/finance.models';

interface ListEnvelope<T> {
  readonly items: readonly T[];
  readonly total: number;
}

@Injectable({ providedIn: 'root' })
export class FinanceApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listInvoices(query?: string): Observable<readonly FinanceInvoice[]> {
    const suffix = query?.trim() ? `?query=${encodeURIComponent(query.trim())}` : '';
    return this.http
      .get<ApiEnvelope<ListEnvelope<FinanceInvoice>>>(`${this.baseUrl}/finance/invoices${suffix}`, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'finance.invoices'),
      })
      .pipe(map((response) => response.data.items));
  }

  listStudents(): Observable<readonly FinanceStudent[]> {
    return this.http
      .get<ApiEnvelope<ListEnvelope<FinanceStudent>>>(`${this.baseUrl}/students`, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'students.read'),
      })
      .pipe(map((response) => response.data.items));
  }

  listExpenses(): Observable<readonly FinanceExpense[]> {
    return this.http
      .get<ApiEnvelope<ListEnvelope<FinanceExpense>>>(`${this.baseUrl}/finance/expenses?status=ALL`, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'finance.expenses'),
      })
      .pipe(map((response) => response.data.items));
  }

  getReport(): Observable<FinanceReport> {
    return this.http
      .get<ApiEnvelope<FinanceReport>>(`${this.baseUrl}/finance/reports/summary`, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'finance.reports'),
      })
      .pipe(map((response) => response.data));
  }

  createInvoice(input: FinanceInvoiceInput): Observable<FinanceInvoice> {
    return this.http
      .post<ApiEnvelope<FinanceInvoice>>(`${this.baseUrl}/finance/invoices`, input, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'finance.invoices.write'),
      })
      .pipe(map((response) => response.data));
  }

  createPayment(invoiceId: string, input: FinancePaymentInput): Observable<FinancePaymentResult> {
    return this.http
      .post<ApiEnvelope<FinancePaymentResult>>(`${this.baseUrl}/finance/invoices/${encodeURIComponent(invoiceId)}/payments`, input, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'finance.payments.write'),
      })
      .pipe(map((response) => response.data));
  }

  uploadPaymentEvidence(paymentId: string, file: File): Observable<FinanceEvidenceResult> {
    const body = new FormData();
    body.append('file', file);
    return this.http
      .post<ApiEnvelope<FinanceEvidenceResult>>(`${this.baseUrl}/finance/payments/${encodeURIComponent(paymentId)}/evidence`, body, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'finance.payment-evidence.write'),
      })
      .pipe(map((response) => response.data));
  }

  createExpense(input: FinanceExpenseInput): Observable<FinanceExpense> {
    return this.http
      .post<ApiEnvelope<FinanceExpense>>(`${this.baseUrl}/finance/expenses`, input, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'finance.expenses.write'),
      })
      .pipe(map((response) => response.data));
  }

  decideExpense(expenseId: string, decision: 'approve' | 'reject', reason: string): Observable<FinanceExpense> {
    return this.http
      .post<ApiEnvelope<FinanceExpense>>(`${this.baseUrl}/finance/expenses/${encodeURIComponent(expenseId)}/${decision}`, { reason }, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'finance.expenses.approve'),
      })
      .pipe(map((response) => response.data));
  }
}
