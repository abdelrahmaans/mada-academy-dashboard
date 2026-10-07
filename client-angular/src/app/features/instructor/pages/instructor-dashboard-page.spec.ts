import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../core/auth/auth.service';
import { InstructorApiService } from '../data-access/instructor-api.service';
import { InstructorDataService } from '../data-access/instructor-data.service';
import { InstructorDashboardPage } from './instructor-dashboard-page';

const session = { id: 'session-1', sessionNumber: 1, status: 'IN_PROGRESS' as const, endAt: '2020-01-01T10:00:00Z', startAt: '2020-01-01T09:00:00Z', instructorId: 'instructor-1' };
const attendance = { sessionId: 'session-1', sessionStatus: 'IN_PROGRESS' as const, total: 1, items: [{ studentId: 'student-1', studentName: 'طالب 1', status: 'PRESENT' as const, lateMinutes: null }] };

describe('InstructorDashboardPage', () => {
  function setup(apiOverrides: Record<string, unknown> = {}) {
    const api = { getAttendance: vi.fn(() => of(attendance)), listEvaluations: vi.fn(() => of([])), saveAttendance: vi.fn(() => of(attendance)), saveEvaluations: vi.fn(() => of({ saved: 1 })), submitEvaluations: vi.fn(() => of({ submitted: 1 })), completeSession: vi.fn(() => of({ sessionId: 'session-1', status: 'COMPLETED' as const, completedAt: '2026-10-07T10:00:00Z' })), requestSubstitution: vi.fn(() => of({ approvalId: 'approval-1', sessionId: 'session-1', state: 'PENDING' })), ...apiOverrides };
    const data = { loadWorkspace: vi.fn(() => of({ sessions: [session], students: [], attendanceBySession: {} })) };
    TestBed.configureTestingModule({ imports: [InstructorDashboardPage], providers: [provideRouter([]), { provide: InstructorApiService, useValue: api }, { provide: InstructorDataService, useValue: data }, { provide: AuthService, useValue: { me: () => ({ id: 'instructor-1' }) } }] });
    return { page: TestBed.createComponent(InstructorDashboardPage).componentInstance, api };
  }
  it('loads attendance and evaluations for the selected assigned session', () => { const { page, api } = setup(); expect(page.selectedSessionId()).toBe('session-1'); expect(page.attendance()?.items[0].studentId).toBe('student-1'); expect(api.listEvaluations).toHaveBeenCalledWith('session-1'); });
  it('blocks submission until every enrolled student has a score and note', () => { const { page, api } = setup(); page.submitEvaluations(); expect(api.submitEvaluations).not.toHaveBeenCalled(); expect(page.error()).toContain('الدرجة'); });
  it('saves and submits a complete evaluation batch', () => { const { page, api } = setup(); page.setEvaluationScore('student-1', '91'); page.setEvaluationNotes('student-1', 'ملاحظة بناءة'); page.saveEvaluations(); expect(api.saveEvaluations).toHaveBeenCalledWith('session-1', [{ studentId: 'student-1', score: 91, notes: 'ملاحظة بناءة' }]); page.submitEvaluations(); expect(api.submitEvaluations).toHaveBeenCalledWith('session-1', ['student-1']); });
  it('does not start a second evaluation save while the first is pending', () => { const pending = new Subject<{ saved: number }>(); const { page, api } = setup({ saveEvaluations: vi.fn(() => pending.asObservable()) }); page.setEvaluationScore('student-1', '80'); page.saveEvaluations(); page.saveEvaluations(); expect(api.saveEvaluations).toHaveBeenCalledTimes(1); pending.next({ saved: 1 }); pending.complete(); });
  it('completes only after attendance is marked', () => { const { page, api } = setup(); page.completeSession(); expect(api.completeSession).toHaveBeenCalledWith('session-1'); expect(page.selectedSession()?.status).toBe('COMPLETED'); });
  it('keeps a completion API error visible', () => { const { page } = setup({ completeSession: vi.fn(() => throwError(() => new Error('SESSION_NOT_ENDED'))) }); page.completeSession(); expect(page.error()).toBe('SESSION_NOT_ENDED'); });
  it('sends a substitution request once for the primary assigned instructor', () => { const { page, api } = setup(); page.setSubstitutionReason('ظرف طارئ'); page.requestSubstitution(); page.requestSubstitution(); expect(api.requestSubstitution).toHaveBeenCalledTimes(1); expect(api.requestSubstitution).toHaveBeenCalledWith('session-1', 'ظرف طارئ'); expect(page.substitutionSent()).toBe(true); });
});
