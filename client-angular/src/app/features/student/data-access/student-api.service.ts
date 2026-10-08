import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiEnvelope } from '../../../core/auth/auth.models';
import { ENDPOINT_POLICY } from '../../../core/http/endpoint-policy.interceptor';
import type { ConsumerSession, ConsumerStudent } from '../models/student.models';

interface ListEnvelope<T> {
  readonly items: readonly T[];
  readonly total: number;
}

@Injectable({ providedIn: 'root' })
export class StudentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly consumerContext = new HttpContext().set(ENDPOINT_POLICY, 'consumer.portal');

  listMyStudents(): Observable<readonly ConsumerStudent[]> {
    return this.http
      .get<ApiEnvelope<ListEnvelope<ConsumerStudent>>>(`${this.baseUrl}/consumer/me/students`, { context: this.consumerContext })
      .pipe(map((response) => response.data.items));
  }

  listMySessions(): Observable<readonly ConsumerSession[]> {
    return this.http
      .get<ApiEnvelope<ListEnvelope<ConsumerSession>>>(`${this.baseUrl}/consumer/me/sessions`, { context: this.consumerContext })
      .pipe(map((response) => response.data.items));
  }
}
