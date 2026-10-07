import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../core/auth/auth.service';
import type { AuthMe } from '../../../core/auth/auth.models';
import { AuthorizationService } from '../../../core/auth/authorization.service';
import { SecretaryApiService } from '../data-access/secretary-api.service';
import type { SecretaryStudent } from '../models/secretary.models';
import { SecretaryDashboardPage } from './secretary-dashboard-page';

const secretary: AuthMe = {
  id: 'secretary-1',
  accountType: 'staff',
  role: 'R05_SECRETARY',
  tenantId: 'tenant-1',
  branchId: 'branch-1',
  scopeLevel: 'BRANCH',
  permissions: ['students.read', 'students.create', 'invoices.read'],
};

const student: SecretaryStudent = {
  id: 'student-1',
  branchId: 'branch-1',
  fullName: 'طالب أول',
  dateOfBirth: '2014-05-12',
  status: 'ACTIVE',
  activeEnrollmentCount: 0,
};

describe('SecretaryDashboardPage', () => {
  function setup() {
    const api = {
      listStudents: vi.fn(() => of([student])),
      listInvoices: vi.fn(() => of([])),
      listGroups: vi.fn(() => of([])),
      getConsumerLinks: vi.fn(() => of({ studentId: student.id, studentAccount: null, guardians: [], totalGuardians: 0 })),
      listEnrollments: vi.fn(() => of([])),
      createStudent: vi.fn(() => of({ ...student, id: 'student-2', fullName: 'طالب جديد' })),
      updateStudent: vi.fn(() => of(student)),
      enrollStudent: vi.fn(() => of({ id: 'enrollment-1' })),
      cancelEnrollment: vi.fn(() => of(undefined)),
      searchConsumerAccounts: vi.fn(() => of([])),
      linkGuardian: vi.fn(() => of(undefined)),
      linkStudentAccount: vi.fn(() => of(undefined)),
      createConsumerInvitation: vi.fn(() => of({ maskedPhone: '•••• 0000', otpExpiresAt: '2026-10-07T10:00:00Z', delivery: 'development' })),
    };
    TestBed.configureTestingModule({
      imports: [SecretaryDashboardPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { me: signal(secretary), logout: vi.fn(() => of(undefined)) } },
        { provide: AuthorizationService, useValue: { hasRole: vi.fn(() => true) } },
        { provide: SecretaryApiService, useValue: api },
      ],
    });
    return { page: TestBed.createComponent(SecretaryDashboardPage).componentInstance, api };
  }

  it('loads live branch data and creates a student through the typed API', () => {
    const { page, api } = setup();

    expect(page.students()).toEqual([student]);
    expect(api.listStudents).toHaveBeenCalledOnce();
    expect(api.getConsumerLinks).toHaveBeenCalledWith('student-1');
    expect(api.listEnrollments).toHaveBeenCalledWith('student-1');

    page.openCreateStudent();
    page.studentFormName.set('طالب جديد');
    page.studentFormDateOfBirth.set('2015-02-01');
    page.saveStudent();

    expect(api.createStudent).toHaveBeenCalledWith('طالب جديد', '2015-02-01');
    expect(page.actionMessage()).toBe('تم إنشاء الطالب داخل نطاق الفرع.');
  });

  it('sends only the selected student, group, and piastre amount when enrolling', () => {
    const { page, api } = setup();

    page.enrollmentGroupId.set('group-1');
    page.enrollmentPrice.set(35000);
    page.enrollSelected();

    expect(api.enrollStudent).toHaveBeenCalledWith('student-1', 'group-1', 35000);
    expect(page.actionMessage()).toBe('تم تسجيل الطالب في المجموعة.');
  });
});
