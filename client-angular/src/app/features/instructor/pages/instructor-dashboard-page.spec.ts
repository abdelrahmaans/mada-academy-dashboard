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
      listEvaluations: vi.fn(() => of([])),
      saveEvaluations: vi.fn(() => of({ saved: 1 })),
      submitEvaluations: vi.fn(() => of({ submitted: 1 })),
      completeSession: vi.fn(() => of({ sessionId: 'session-1', status: 'COMPLETED' })),
      requestSubstitution: vi.fn(() =>
        of({ approvalId: 'approval-1', sessionId: 'session-1', state: 'PENDING' }),
      ),
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
    expect(api.listEvaluations).toHaveBeenCalledWith('session-1');
  });

  it('keeps the R04 evaluation draft private until the instructor submits it for review', () => {
    const api = {
      getAttendance: vi.fn(() =>
        of({
          sessionId: 'session-1',
          sessionStatus: 'IN_PROGRESS',
          items: [{ studentId: 'student-1', studentName: 'طالب 1', status: 'PRESENT', lateMinutes: null }],
          total: 1,
        }),
      ),
      listEvaluations: vi.fn(() =>
        of([{ studentId: 'student-1', score: 88, notes: 'ملاحظة بناءة', status: 'DRAFT' }]),
      ),
      saveEvaluations: vi.fn(() => of({ saved: 1 })),
      submitEvaluations: vi.fn(() => of({ submitted: 1 })),
      saveAttendance: vi.fn(),
      completeSession: vi.fn(),
      requestSubstitution: vi.fn(),
    };
    const data = {
      loadWorkspace: vi.fn(() =>
        of({ sessions: [{ id: 'session-1', sessionNumber: 1 }], students: [], attendanceBySession: {} }),
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
    page.evaluationScore.set(88);
    page.evaluationNotes.set('ملاحظة بناءة');
    page.saveEvaluation();

    expect(api.saveEvaluations).toHaveBeenCalledWith('session-1', [
      { studentId: 'student-1', score: 88, notes: 'ملاحظة بناءة' },
    ]);
    page.submitEvaluation();
    expect(api.submitEvaluations).toHaveBeenCalledWith('session-1', ['student-1']);
  });
});
