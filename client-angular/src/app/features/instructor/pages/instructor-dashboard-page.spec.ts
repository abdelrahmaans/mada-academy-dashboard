import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { InstructorApiService } from '../data-access/instructor-api.service';
import { InstructorDataService } from '../data-access/instructor-data.service';
import { InstructorDashboardPage } from './instructor-dashboard-page';

describe('InstructorDashboardPage', () => {
  it('loads assigned sessions and then reads attendance for the selected session', () => {
    const api = {
      getAttendance: vi.fn(() =>
        of({
          sessionId: 'session-1',
          sessionStatus: 'IN_PROGRESS',
          items: [
            {
              studentId: 'student-1',
              studentName: 'طالب 1',
              status: 'UNMARKED',
              lateMinutes: null,
            },
          ],
          total: 1,
        }),
      ),
      saveAttendance: vi.fn(),
    };
    const data = {
      loadWorkspace: vi.fn(() =>
        of({
          sessions: [{ id: 'session-1', sessionNumber: 1 }],
          students: [],
          attendanceBySession: {},
        }),
      ),
    };
    TestBed.configureTestingModule({
      imports: [InstructorDashboardPage],
      providers: [
        provideRouter([]),
        { provide: InstructorApiService, useValue: api },
        { provide: InstructorDataService, useValue: data },
      ],
    });

    const page = TestBed.createComponent(InstructorDashboardPage).componentInstance;

    expect(page.loading()).toBe(false);
    expect(page.selectedSessionId()).toBe('session-1');
    expect(page.attendance()?.items[0].studentId).toBe('student-1');
    expect(api.getAttendance).toHaveBeenCalledWith('session-1');
  });
});
