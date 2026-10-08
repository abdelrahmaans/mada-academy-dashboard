import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiEnvelope } from '../../../core/auth/auth.models';
import { ENDPOINT_POLICY } from '../../../core/http/endpoint-policy.interceptor';
import type { FamilyChild, FamilyInvoice, FamilySession } from '../models/family.models';

interface ListEnvelope<T> {
  readonly items: readonly T[];
  readonly total: number;
}

@Injectable({ providedIn: 'root' })
export class FamilyApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly portalContext = new HttpContext().set(ENDPOINT_POLICY, 'consumer.portal');
  private readonly invoiceContext = new HttpContext().set(ENDPOINT_POLICY, 'consumer.invoices');

  listMyChildren(): Observable<readonly FamilyChild[]> {
    return this.http
      .get<ApiEnvelope<ListEnvelope<FamilyChild>>>(`${this.baseUrl}/consumer/me/students`, { context: this.portalContext })
      .pipe(map((response) => response.data.items));
  }

  listMySessions(): Observable<readonly FamilySession[]> {
    return this.http
      .get<ApiEnvelope<ListEnvelope<FamilySession>>>(`${this.baseUrl}/consumer/me/sessions`, { context: this.portalContext })
      .pipe(map((response) => response.data.items));
  }

  listMyInvoices(): Observable<readonly FamilyInvoice[]> {
    return this.http
      .get<ApiEnvelope<ListEnvelope<FamilyInvoice>>>(`${this.baseUrl}/consumer/invoices`, { context: this.invoiceContext })
      .pipe(map((response) => response.data.items));
  }
}
