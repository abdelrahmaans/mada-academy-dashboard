import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../../../core/auth/auth.service';
import type { AuthMe } from '../../../core/auth/auth.models';
import { endpointPolicyInterceptor } from '../../../core/http/endpoint-policy.interceptor';
import { SecretaryApiService } from './secretary-api.service';

const secretary: AuthMe = {
  id: 'secretary-1',
  accountType: 'staff',
  role: 'R05_SECRETARY',
  tenantId: 'tenant-1',
  branchId: 'branch-1',
  scopeLevel: 'BRANCH',
  permissions: ['students.read', 'students.create', 'invoices.read', 'invoices.create', 'payments.create'],
};

describe('SecretaryApiService', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { me: signal(secretary) } },
        provideHttpClient(withInterceptors([endpointPolicyInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    return { api: TestBed.inject(SecretaryApiService), http: TestBed.inject(HttpTestingController) };
  }

  it('loads students and invoices without accepting client-selected tenant or branch scope', () => {
    const { api, http } = setup();
    api.listStudents().subscribe();
    const students = http.expectOne((request) => request.url.endsWith('/api/v1/students'));
    expect(students.request.urlWithParams).not.toContain('tenantId');
    expect(students.request.urlWithParams).not.toContain('branchId');
    students.flush({ data: { items: [], total: 0, scopeLevel: 'BRANCH', branchId: 'branch-1' } });

    api.listInvoices('سارة').subscribe();
    const invoices = http.expectOne((request) => request.urlWithParams.includes('/api/v1/finance/invoices?query='));
    expect(invoices.request.urlWithParams).toContain('query=%D8%B3%D8%A7%D8%B1%D8%A9');
    expect(invoices.request.urlWithParams).not.toContain('branchId');
    invoices.flush({ data: { items: [], total: 0 } });
  });

  it('uses scoped consumer-link and invitation contracts', () => {
    const { api, http } = setup();
    api.getConsumerLinks('student-1').subscribe();
    const links = http.expectOne((request) => request.url.endsWith('/students/student-1/consumer-links'));
    links.flush({ data: { studentId: 'student-1', studentAccount: null, guardians: [], totalGuardians: 0 } });

    api.searchConsumerAccounts('student-1', '+201000000000', 'parent').subscribe();
    const lookup = http.expectOne((request) => request.url.includes('/students/student-1/consumer-accounts'));
    expect(lookup.request.urlWithParams).toContain('accountType=parent');
    expect(lookup.request.urlWithParams).toContain('phone=%2B201000000000');
    lookup.flush({ data: { items: [], total: 0 } });

    api.createConsumerInvitation('student-1', '+201000000000', 'parent', 'الأم').subscribe();
    const invitation = http.expectOne((request) => request.url.endsWith('/students/student-1/consumer-invitations'));
    expect(invitation.request.method).toBe('POST');
    expect(invitation.request.body).toEqual({ phone: '+201000000000', accountType: 'parent', relationship: 'الأم' });
    invitation.flush({ data: { maskedPhone: '•••• 0000', otpExpiresAt: '2026-10-07T10:00:00Z', delivery: 'development' } });
  });

  it('uses live student and enrollment mutations without accepting client scope', () => {
    const { api, http } = setup();
    api.createStudent('طالب جديد', '2014-05-12').subscribe();
    const create = http.expectOne((request) => request.url.endsWith('/api/v1/students'));
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ fullName: 'طالب جديد', dateOfBirth: '2014-05-12' });
    expect(create.request.body.tenantId).toBeUndefined();
    expect(create.request.body.branchId).toBeUndefined();
    create.flush({ data: { id: 'student-1', branchId: 'branch-1', fullName: 'طالب جديد', dateOfBirth: '2014-05-12', status: 'ACTIVE', activeEnrollmentCount: 0 } });

    api.updateStudent('student-1', 'طالب محدث', null).subscribe();
    const update = http.expectOne((request) => request.url.endsWith('/api/v1/students/student-1'));
    expect(update.request.method).toBe('PUT');
    update.flush({ data: { id: 'student-1', branchId: 'branch-1', fullName: 'طالب محدث', dateOfBirth: null, status: 'ACTIVE', activeEnrollmentCount: 0 } });

    api.listGroups().subscribe();
    const groups = http.expectOne((request) => request.url.endsWith('/api/v1/scheduling/groups'));
    groups.flush({ data: { items: [], total: 0 } });

    api.enrollStudent('student-1', 'group-1', 35000).subscribe();
    const enroll = http.expectOne((request) => request.url.endsWith('/students/student-1/enrollments'));
    expect(enroll.request.method).toBe('POST');
    expect(enroll.request.body).toEqual({ courseOfferingId: 'group-1', finalPricePiastres: 35000 });
    enroll.flush({ data: { id: 'enrollment-1', courseOfferingId: 'group-1', courseName: 'روبوتكس', startDate: '2026-10-01', endDate: '2026-11-01', finalPricePiastres: 35000, status: 'ACTIVE', maxStudents: 10, activeEnrollmentCount: 1 } });

    api.cancelEnrollment('student-1', 'enrollment-1').subscribe();
    const cancel = http.expectOne((request) => request.url.endsWith('/students/student-1/enrollments/enrollment-1'));
    expect(cancel.request.method).toBe('DELETE');
    cancel.flush(null);
  });

  it('sends only a selected account id for linking and never sends scope claims', () => {
    const { api, http } = setup();
    api.linkGuardian('student-1', 'account-1', 'الأم').subscribe();
    const request = http.expectOne((item) => item.url.endsWith('/students/student-1/guardians'));
    expect(request.request.body).toEqual({ userAccountId: 'account-1', relationship: 'الأم' });
    expect(request.request.body.tenantId).toBeUndefined();
    expect(request.request.body.branchId).toBeUndefined();
    request.flush({ data: { studentId: 'student-1', userAccountId: 'account-1', relationship: 'الأم', linked: true } });
  });
});
