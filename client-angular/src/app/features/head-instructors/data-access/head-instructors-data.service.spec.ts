import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HeadInstructorsApiService } from './head-instructors-api.service';
import { HeadInstructorsDataService } from './head-instructors-data.service';

const apiMock = {
  listGroups: vi.fn(),
  listInstructors: vi.fn(),
  listSessions: vi.fn(),
  getEvaluationSummary: vi.fn(),
  listUnreadNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
};

describe('HeadInstructorsDataService', () => {
  let service: HeadInstructorsDataService;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        HeadInstructorsDataService,
        { provide: HeadInstructorsApiService, useValue: apiMock },
      ],
    });
    service = TestBed.inject(HeadInstructorsDataService);
    apiMock.listGroups.mockReturnValue(of([{ id: 'group-1' }]));
    apiMock.listInstructors.mockReturnValue(of([{ id: 'instructor-1' }]));
    apiMock.listSessions.mockReturnValue(of([{ id: 'session-1' }]));
    apiMock.getEvaluationSummary.mockReturnValue(
      of({
        branchId: 'branch-1',
        counts: { DRAFT: 1, SUBMITTED: 2, CHANGES_REQUESTED: 0, PUBLISHED: 3 },
      }),
    );
    apiMock.listUnreadNotifications.mockReturnValue(of([{ id: 'notification-1' }]));
  });

  it('loads all R03 sources concurrently without selecting a branch from the client', () => {
    let result: unknown;
    service.load().subscribe((value) => (result = value));
    expect(apiMock.listInstructors).toHaveBeenCalledWith();
    expect(apiMock.listSessions).toHaveBeenCalledWith(expect.any(String), expect.any(String));
    expect(result).toEqual({
      data: {
        groups: [{ id: 'group-1' }],
        instructors: [{ id: 'instructor-1' }],
        sessions: [{ id: 'session-1' }],
        evaluations: expect.anything(),
        notifications: [{ id: 'notification-1' }],
      },
      warnings: [],
    });
  });

  it('keeps core data when optional evaluation and notification sources fail', () => {
    apiMock.getEvaluationSummary.mockReturnValue(throwError(() => new Error('unavailable')));
    apiMock.listUnreadNotifications.mockReturnValue(throwError(() => new Error('unavailable')));
    let result:
      | {
          data: {
            groups: readonly unknown[];
            instructors: readonly unknown[];
            sessions: readonly unknown[];
          };
          warnings: readonly unknown[];
        }
      | undefined;
    service.load().subscribe((value) => (result = value));
    expect(result?.data.groups).toHaveLength(1);
    expect(result?.data.instructors).toHaveLength(1);
    expect(result?.data.sessions).toHaveLength(1);
    expect(result?.warnings).toEqual([
      { source: 'evaluations', message: 'ملخص التقييمات غير متاح مؤقتًا.' },
      { source: 'notifications', message: 'التنبيهات غير متاحة مؤقتًا.' },
    ]);
  });

  it('fails the aggregate when a core source fails', () => {
    apiMock.listGroups.mockReturnValue(throwError(() => new Error('core unavailable')));
    let error: unknown;
    service.load().subscribe({ error: (cause) => (error = cause) });
    expect(error).toBeInstanceOf(Error);
  });
});
