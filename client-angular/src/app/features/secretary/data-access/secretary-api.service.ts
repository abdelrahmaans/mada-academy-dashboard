import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiEnvelope } from '../../../core/auth/auth.models';
import { ENDPOINT_POLICY } from '../../../core/http/endpoint-policy.interceptor';
import type {
  ConsumerAccountMatch,
  ConsumerAccountType,
  ConsumerInvitationDelivery,
  SecretaryConsumerLinks,
  SecretaryEnrollment,
  SecretaryGroup,
  SecretaryInvoice,
  SecretaryStudent,
} from '../models/secretary.models';

interface ListEnvelope<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly scopeLevel?: string;
  readonly branchId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SecretaryApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listStudents(): Observable<readonly SecretaryStudent[]> {
    return this.http
      .get<ApiEnvelope<ListEnvelope<SecretaryStudent>>>(`${this.baseUrl}/students`, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'students.read'),
      })
      .pipe(map((response) => response.data.items));
  }

  createStudent(fullName: string, dateOfBirth: string | null): Observable<SecretaryStudent> {
    return this.http
      .post<ApiEnvelope<SecretaryStudent>>(`${this.baseUrl}/students`, { fullName, dateOfBirth: dateOfBirth || null }, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'students.write'),
      })
      .pipe(map((response) => response.data));
  }

  updateStudent(studentId: string, fullName: string, dateOfBirth: string | null): Observable<SecretaryStudent> {
    return this.http
      .put<ApiEnvelope<SecretaryStudent>>(`${this.baseUrl}/students/${encodeURIComponent(studentId)}`, { fullName, dateOfBirth: dateOfBirth || null }, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'students.write'),
      })
      .pipe(map((response) => response.data));
  }

  listGroups(): Observable<readonly SecretaryGroup[]> {
    return this.http
      .get<ApiEnvelope<ListEnvelope<SecretaryGroup>>>(`${this.baseUrl}/scheduling/groups`, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'sessions.read'),
      })
      .pipe(map((response) => response.data.items));
  }

  listEnrollments(studentId: string): Observable<readonly SecretaryEnrollment[]> {
    return this.http
      .get<ApiEnvelope<ListEnvelope<SecretaryEnrollment>>>(`${this.baseUrl}/students/${encodeURIComponent(studentId)}/enrollments`, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'student.enrollments'),
      })
      .pipe(map((response) => response.data.items));
  }

  enrollStudent(studentId: string, courseOfferingId: string, finalPricePiastres: number): Observable<SecretaryEnrollment> {
    return this.http
      .post<ApiEnvelope<SecretaryEnrollment>>(`${this.baseUrl}/students/${encodeURIComponent(studentId)}/enrollments`, { courseOfferingId, finalPricePiastres }, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'student.enrollments'),
      })
      .pipe(map((response) => response.data));
  }

  cancelEnrollment(studentId: string, enrollmentId: string): Observable<void> {
    return this.http
      .delete(`${this.baseUrl}/students/${encodeURIComponent(studentId)}/enrollments/${encodeURIComponent(enrollmentId)}`, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'student.enrollments'),
      })
      .pipe(map(() => undefined));
  }

  listInvoices(query?: string): Observable<readonly SecretaryInvoice[]> {
    const suffix = query?.trim() ? `?query=${encodeURIComponent(query.trim())}` : '';
    return this.http
      .get<ApiEnvelope<ListEnvelope<SecretaryInvoice>>>(`${this.baseUrl}/finance/invoices${suffix}`, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'finance.invoices'),
      })
      .pipe(map((response) => response.data.items));
  }

  getConsumerLinks(studentId: string): Observable<SecretaryConsumerLinks> {
    return this.http
      .get<ApiEnvelope<SecretaryConsumerLinks>>(
        `${this.baseUrl}/students/${encodeURIComponent(studentId)}/consumer-links`,
        { context: new HttpContext().set(ENDPOINT_POLICY, 'consumer.links') },
      )
      .pipe(map((response) => response.data));
  }

  searchConsumerAccounts(
    studentId: string,
    phone: string,
    accountType: ConsumerAccountType,
  ): Observable<readonly ConsumerAccountMatch[]> {
    const query = new URLSearchParams({ accountType, phone });
    return this.http
      .get<ApiEnvelope<ListEnvelope<ConsumerAccountMatch>>>(
        `${this.baseUrl}/students/${encodeURIComponent(studentId)}/consumer-accounts?${query}`,
        { context: new HttpContext().set(ENDPOINT_POLICY, 'consumer.links') },
      )
      .pipe(map((response) => response.data.items));
  }

  linkStudentAccount(studentId: string, userAccountId: string): Observable<void> {
    return this.http
      .post<ApiEnvelope<unknown>>(
        `${this.baseUrl}/students/${encodeURIComponent(studentId)}/student-account`,
        { userAccountId },
        { context: new HttpContext().set(ENDPOINT_POLICY, 'consumer.links') },
      )
      .pipe(map(() => undefined));
  }

  linkGuardian(studentId: string, userAccountId: string, relationship: string): Observable<void> {
    return this.http
      .post<ApiEnvelope<unknown>>(
        `${this.baseUrl}/students/${encodeURIComponent(studentId)}/guardians`,
        { userAccountId, relationship },
        { context: new HttpContext().set(ENDPOINT_POLICY, 'consumer.links') },
      )
      .pipe(map(() => undefined));
  }

  createConsumerInvitation(
    studentId: string,
    phone: string,
    accountType: ConsumerAccountType,
    relationship?: string,
  ): Observable<ConsumerInvitationDelivery> {
    return this.http
      .post<ApiEnvelope<ConsumerInvitationDelivery>>(
        `${this.baseUrl}/students/${encodeURIComponent(studentId)}/consumer-invitations`,
        { phone, accountType, relationship: relationship?.trim() || undefined },
        { context: new HttpContext().set(ENDPOINT_POLICY, 'consumer.invitations') },
      )
      .pipe(map((response) => response.data));
  }
}
