import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiEnvelope } from '../../../core/auth/auth.models';
import { ENDPOINT_POLICY } from '../../../core/http/endpoint-policy.interceptor';
import type { FinanceExpense, FinanceInvoice, FinanceReport } from '../models/finance.models';

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
}
