import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../../../core/auth/auth.service';
import type { AuthMe } from '../../../core/auth/auth.models';
import { endpointPolicyInterceptor } from '../../../core/http/endpoint-policy.interceptor';
import { StudentApiService } from './student-api.service';

const student: AuthMe = {
  id: 'student-account-1',
  accountType: 'student',
  role: 'R09_STUDENT',
  tenantId: 'tenant-1',
  branchId: null,
  scopeLevel: 'TENANT',
  permissions: ['consumer.self.read', 'consumer.sessions.read', 'consumer.evaluations.read'],
};

describe('StudentApiService', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { me: () => student } },
        provideHttpClient(withInterceptors([endpointPolicyInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    return { api: TestBed.inject(StudentApiService), http: TestBed.inject(HttpTestingController) };
  }

  it('loads only the backend-linked student records without client-selected scope', () => {
    const { api, http } = setup();
    api.listMyStudents().subscribe((items) => expect(items[0].id).toBe('student-1'));
    const request = http.expectOne((item) => item.url.endsWith('/api/v1/consumer/me/students'));
    expect(request.request.method).toBe('GET');
    expect(request.request.urlWithParams).not.toContain('studentId');
    expect(request.request.urlWithParams).not.toContain('tenantId');
    expect(request.request.urlWithParams).not.toContain('branchId');
    request.flush({ data: { items: [{ id: 'student-1', name: 'طالب', branchId: 'branch-1', branchName: 'فرع', relationship: 'SELF' }], total: 1 } });
  });

  it('uses the consumer portal policy and reads sessions without expanding scope', () => {
    const { api, http } = setup();
    api.listMySessions().subscribe((items) => expect(items[0].studentId).toBe('student-1'));
    const request = http.expectOne((item) => item.url.endsWith('/api/v1/consumer/me/sessions'));
    expect(request.request.method).toBe('GET');
    expect(request.request.urlWithParams).not.toContain('studentId');
    expect(request.request.urlWithParams).not.toContain('tenantId');
    expect(request.request.urlWithParams).not.toContain('branchId');
    request.flush({ data: { items: [{ sessionId: 'session-1', studentId: 'student-1', sessionNumber: 1, startAt: '2026-10-07T10:00:00Z', endAt: '2026-10-07T11:00:00Z', status: 'COMPLETED', attendanceStatus: 'PRESENT' }], total: 1 } });
  });
});
