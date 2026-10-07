import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../core/auth/auth.service';
import { HeadInstructorsDataService } from '../data-access/head-instructors-data.service';
import { HeadInstructorsDashboardPage } from './head-instructors-dashboard-page';

const account = {
  id: 'user-1',
  accountType: 'staff',
  role: 'R03_HEAD_INSTRUCTORS',
  roleLabel: 'رئيس المدربين',
  tenantId: 'tenant-1',
  branchId: 'branch-1',
  scopeLevel: 'BRANCH',
  user: { id: 'user-1', displayName: 'مريم حسن', email: null, phone: '01000000000' },
  academy: {
    id: 'tenant-1',
    name: 'أكاديمية مدى',
    slug: 'mada',
    status: 'ACTIVE',
    planCode: 'MVP',
  },
  branches: [{ id: 'branch-1', name: 'مدينة نصر', code: 'NSR', status: 'ACTIVE' }],
};

describe('HeadInstructorsDashboardPage', () => {
  const dataService = { load: vi.fn(), markNotificationRead: vi.fn() };
  const router = { navigateByUrl: vi.fn() };
  const route = { snapshot: {}, params: of({}), queryParams: of({}) };

  beforeEach(() => {
    vi.resetAllMocks();
    dataService.load.mockReturnValue(
      of({
        data: {
          groups: [],
          instructors: [],
          sessions: [],
          evaluations: {
            branchId: 'branch-1',
            counts: { DRAFT: 0, SUBMITTED: 0, CHANGES_REQUESTED: 0, PUBLISHED: 0 },
          },
          notifications: [],
        },
        warnings: [],
      }),
    );
    dataService.markNotificationRead.mockReturnValue(of(undefined));
  });

  it('loads only for R03 and keeps the role boundary in the page surface', () => {
    TestBed.configureTestingModule({
      imports: [HeadInstructorsDashboardPage],
      providers: [
        { provide: AuthService, useValue: { me: signal(account), logout: () => of(undefined) } },
        { provide: HeadInstructorsDataService, useValue: dataService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
      ],
    });
    const page = TestBed.createComponent(HeadInstructorsDashboardPage).componentInstance;
    expect(dataService.load).toHaveBeenCalledTimes(1);
    expect(page.isHeadInstructor()).toBe(true);
  });

  it('does not call R03 endpoints for another staff role', () => {
    const nonR03 = { ...account, role: 'R02_BRANCH_MANAGER' };
    TestBed.configureTestingModule({
      imports: [HeadInstructorsDashboardPage],
      providers: [
        { provide: AuthService, useValue: { me: signal(nonR03), logout: () => of(undefined) } },
        { provide: HeadInstructorsDataService, useValue: dataService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
      ],
    });
    const page = TestBed.createComponent(HeadInstructorsDashboardPage).componentInstance;
    expect(dataService.load).not.toHaveBeenCalled();
    expect(page.error()).toContain('لا يحتوي على فرع');
  });
});
