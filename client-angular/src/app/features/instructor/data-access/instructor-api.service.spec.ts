import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../../../core/auth/auth.service';
import type { AuthMe } from '../../../core/auth/auth.models';
import { endpointPolicyInterceptor } from '../../../core/http/endpoint-policy.interceptor';
import { InstructorApiService } from './instructor-api.service';

const instructor: AuthMe = { id: 'instructor-1', accountType: 'staff', role: 'R04_INSTRUCTOR', tenantId: 'tenant-1', branchId: 'branch-1', scopeLevel: 'BRANCH', permissions: ['sessions.assigned.read', 'attendance.read', 'attendance.write', 'evaluations.write'] };

describe('InstructorApiService', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: { me: signal(instructor) } }, provideHttpClient(withInterceptors([endpointPolicyInterceptor])), provideHttpClientTesting()] });
    return { api: TestBed.inject(InstructorApiService), http: TestBed.inject(HttpTestingController) };
  }
  it('uses assigned-session policy without client-selected scope', () => {
    const { api, http } = setup();
    api.listSessions('2026-10-01T00:00:00Z', '2026-10-31T23:59:59Z').subscribe();
    const request = http.expectOne((item) => item.url.includes('/sessions'));
    expect(request.request.urlWithParams).not.toContain('tenantId');
    expect(request.request.urlWithParams).not.toContain('branchId');
    request.flush({ data: { items: [], total: 0 } });
  });
  it('writes attendance and uses typed lifecycle payloads', () => {
    const { api, http } = setup();
    api.saveAttendance('session-1', [{ studentId: 'student-1', status: 'LATE', lateMinutes: 5 }]).subscribe();
    const attendance = http.expectOne((item) => item.url.endsWith('/api/v1/sessions/session-1/attendance'));
    expect(attendance.request.method).toBe('PUT');
    expect(attendance.request.body).toEqual({ records: [{ studentId: 'student-1', status: 'LATE', lateMinutes: 5 }] });
    attendance.flush({ data: { sessionId: 'session-1', sessionStatus: 'IN_PROGRESS', items: [], total: 0 } });
    api.completeSession('session-1').subscribe();
    const complete = http.expectOne((item) => item.url.endsWith('/api/v1/sessions/session-1/complete'));
    expect(complete.request.method).toBe('POST');
    complete.flush({ data: { sessionId: 'session-1', status: 'COMPLETED', completedAt: '2026-10-07T10:00:00Z' } });
  });
  it('sends evaluation save/submit and substitution contracts', () => {
    const { api, http } = setup();
    api.saveEvaluations('session-1', [{ studentId: 'student-1', score: 90, notes: 'جيد' }]).subscribe();
    const save = http.expectOne((item) => item.url.endsWith('/evaluations'));
    expect(save.request.body).toEqual({ items: [{ studentId: 'student-1', score: 90, notes: 'جيد' }] });
    save.flush({ data: { saved: 1 } });
    api.submitEvaluations('session-1', ['student-1']).subscribe();
    const submit = http.expectOne((item) => item.url.endsWith('/evaluations/submit'));
    expect(submit.request.body).toEqual({ studentIds: ['student-1'] });
    submit.flush({ data: { submitted: 1 } });
    api.requestSubstitution('session-1', 'ظرف طارئ').subscribe();
    const substitution = http.expectOne((item) => item.url.endsWith('/substitution-requests'));
    expect(substitution.request.body).toEqual({ reason: 'ظرف طارئ' });
    substitution.flush({ data: { approvalId: 'approval-1', sessionId: 'session-1', state: 'PENDING' } });
  });
});
