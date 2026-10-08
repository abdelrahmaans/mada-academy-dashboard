import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { ApiEnvelope } from '../../../core/auth/auth.models';
import { ENDPOINT_POLICY } from '../../../core/http/endpoint-policy.interceptor';
import type { AttendanceInput, InstructorApprovalRequest, InstructorAttendance, InstructorSession, InstructorStudent, SessionEvaluation, EvaluationInput } from '../models/instructor.models';

interface ListEnvelope<T> { readonly items: readonly T[]; readonly total: number; readonly scopeLevel?: string; readonly branchId?: string | null; }

@Injectable({ providedIn: 'root' })
export class InstructorApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listStudents(): Observable<readonly InstructorStudent[]> { return this.http.get<ApiEnvelope<ListEnvelope<InstructorStudent>>>(`${this.baseUrl}/students`, { context: new HttpContext().set(ENDPOINT_POLICY, 'sessions.assigned.read') }).pipe(map((response) => response.data.items)); }
  listSessions(from?: string, to?: string): Observable<readonly InstructorSession[]> { const query = new URLSearchParams(); if (from) query.set('from', from); if (to) query.set('to', to); const suffix = query.toString() ? `?${query}` : ''; return this.http.get<ApiEnvelope<ListEnvelope<InstructorSession>>>(`${this.baseUrl}/sessions${suffix}`, { context: new HttpContext().set(ENDPOINT_POLICY, 'sessions.assigned.read') }).pipe(map((response) => response.data.items)); }
  getSession(sessionId: string): Observable<InstructorSession> { return this.http.get<ApiEnvelope<InstructorSession>>(`${this.baseUrl}/sessions/${encodeURIComponent(sessionId)}`, { context: new HttpContext().set(ENDPOINT_POLICY, 'sessions.assigned.read') }).pipe(map((response) => response.data)); }
  getAttendance(sessionId: string): Observable<InstructorAttendance> { return this.http.get<ApiEnvelope<InstructorAttendance>>(`${this.baseUrl}/sessions/${encodeURIComponent(sessionId)}/attendance`, { context: new HttpContext().set(ENDPOINT_POLICY, 'attendance.read') }).pipe(map((response) => response.data)); }
  saveAttendance(sessionId: string, records: readonly AttendanceInput[]): Observable<InstructorAttendance> { return this.http.put<ApiEnvelope<InstructorAttendance>>(`${this.baseUrl}/sessions/${encodeURIComponent(sessionId)}/attendance`, { records }, { context: new HttpContext().set(ENDPOINT_POLICY, 'attendance.write') }).pipe(map((response) => response.data)); }
  completeSession(sessionId: string): Observable<{ readonly sessionId: string; readonly status: InstructorSession['status']; readonly completedAt: string }> { return this.http.post<ApiEnvelope<{ readonly sessionId: string; readonly status: InstructorSession['status']; readonly completedAt: string }>>(`${this.baseUrl}/sessions/${encodeURIComponent(sessionId)}/complete`, {}, { context: new HttpContext().set(ENDPOINT_POLICY, 'sessions.assigned.read') }).pipe(map((response) => response.data)); }
  listEvaluations(sessionId: string): Observable<readonly SessionEvaluation[]> { return this.http.get<ApiEnvelope<ListEnvelope<SessionEvaluation>>>(`${this.baseUrl}/scheduling/sessions/${encodeURIComponent(sessionId)}/evaluations`, { context: new HttpContext().set(ENDPOINT_POLICY, 'evaluations.write') }).pipe(map((response) => response.data.items)); }
  saveEvaluations(sessionId: string, items: readonly EvaluationInput[]): Observable<{ readonly saved: number }> { return this.http.put<ApiEnvelope<{ readonly saved: number }>>(`${this.baseUrl}/scheduling/sessions/${encodeURIComponent(sessionId)}/evaluations`, { items }, { context: new HttpContext().set(ENDPOINT_POLICY, 'evaluations.write') }).pipe(map((response) => response.data)); }
  submitEvaluations(sessionId: string, studentIds: readonly string[]): Observable<{ readonly submitted: number }> { return this.http.post<ApiEnvelope<{ readonly submitted: number }>>(`${this.baseUrl}/scheduling/sessions/${encodeURIComponent(sessionId)}/evaluations/submit`, { studentIds }, { context: new HttpContext().set(ENDPOINT_POLICY, 'evaluations.write') }).pipe(map((response) => response.data)); }
  requestSubstitution(sessionId: string, reason: string): Observable<InstructorApprovalRequest> { return this.http.post<ApiEnvelope<InstructorApprovalRequest>>(`${this.baseUrl}/scheduling/sessions/${encodeURIComponent(sessionId)}/substitution-requests`, { reason }, { context: new HttpContext().set(ENDPOINT_POLICY, 'evaluations.write') }).pipe(map((response) => response.data)); }
}
