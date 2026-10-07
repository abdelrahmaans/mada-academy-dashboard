import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../../../core/auth/auth.service';
import type { AuthMe } from '../../../core/auth/auth.models';
import { endpointPolicyInterceptor } from '../../../core/http/endpoint-policy.interceptor';
import { InstructorApiService } from './instructor-api.service';

const instructor: AuthMe = {
  id: 'instructor-1',
  accountType: 'staff',
  role: 'R04_INSTRUCTOR',
  tenantId: 'tenant-1',
  branchId: 'branch-1',
  scopeLevel: 'BRANCH',
  permissions: [
    'students.read',
    'sessions.read',
    'sessions.assigned.read',
    'attendance.read',
    'attendance.write',
    'evaluations.write',
  ],
};

describe('InstructorApiService', () => {
  it('reads assigned sessions without sending tenantId or branchId query parameters', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { me: signal(instructor) } },
        provideHttpClient(withInterceptors([endpointPolicyInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const api = TestBed.inject(InstructorApiService);
    const http = TestBed.inject(HttpTestingController);

    api.listSessions('2026-10-01T00:00:00Z', '2026-10-31T23:59:59Z').subscribe();
    const request = http.expectOne((item) => item.url.includes('/sessions'));
    expect(request.request.urlWithParams).not.toContain('tenantId');
    expect(request.request.urlWithParams).not.toContain('branchId');
    expect(request.request.context.get as unknown).toBeDefined();
    request.flush({ data: { items: [], total: 0, scopeLevel: 'BRANCH', branchId: 'branch-1' } });
  });

  it('writes attendance using the matrix endpoint policy and typed payload', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { me: signal(instructor) } },
        provideHttpClient(withInterceptors([endpointPolicyInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const api = TestBed.inject(InstructorApiService);
    const http = TestBed.inject(HttpTestingController);

    api
      .saveAttendance('session-1', [{ studentId: 'student-1', status: 'LATE', lateMinutes: 5 }])
      .subscribe();
    const request = http.expectOne((item) =>
      item.url.endsWith('/api/v1/sessions/session-1/attendance'),
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      records: [{ studentId: 'student-1', status: 'LATE', lateMinutes: 5 }],
    });
    request.flush({
      data: { sessionId: 'session-1', sessionStatus: 'IN_PROGRESS', items: [], total: 0 },
    });
  });
});
