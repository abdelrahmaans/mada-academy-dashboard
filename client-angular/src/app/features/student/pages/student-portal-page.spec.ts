import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, type Observable } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../core/auth/auth.service';
import type { ConsumerSession, ConsumerStudent } from '../models/student.models';
import { StudentApiService } from '../data-access/student-api.service';
import { StudentPortalPage } from './student-portal-page';

const linkedStudent: ConsumerStudent = { id: 'student-1', name: 'طالب مرتبط', branchId: 'branch-1', branchName: 'فرع رئيسي', relationship: 'SELF' };
const session: ConsumerSession = { sessionId: 'session-1', studentId: 'student-1', sessionNumber: 1, startAt: '2026-10-07T10:00:00Z', endAt: '2026-10-07T11:00:00Z', status: 'COMPLETED', courseName: 'روبوتكس', classroomName: 'قاعة 1', branchName: 'فرع رئيسي', attendanceStatus: 'PRESENT', score: 90, notes: 'جيد' };

function create(api: { listMyStudents: () => Observable<readonly ConsumerStudent[]>; listMySessions: () => Observable<readonly ConsumerSession[]> }): ComponentFixture<StudentPortalPage> {
  TestBed.configureTestingModule({
    imports: [StudentPortalPage],
    providers: [
      { provide: StudentApiService, useValue: api },
      { provide: AuthService, useValue: { me: () => ({ user: { displayName: 'طالب' } }), logout: () => of(undefined) } },
      { provide: Router, useValue: { navigate: vi.fn() } },
      { provide: ActivatedRoute, useValue: {} },
    ],
  });
  return TestBed.createComponent(StudentPortalPage);
}

describe('StudentPortalPage', () => {
  it('keeps the linked profile when sessions fail and exposes a retry warning', () => {
    const fixture = create({ listMyStudents: () => of([linkedStudent]), listMySessions: () => throwError(() => new Error('جلسات غير متاحة')) });
    fixture.detectChanges();
    const page = fixture.componentInstance;
    expect(page.student()?.id).toBe('student-1');
    expect(page.sessions()).toEqual([]);
    expect(page.sessionsWarning()).toContain('جلسات غير متاحة');
    expect(page.profileError()).toBeNull();
  });

  it('does not invent a student profile or sessions when the backend returns empty data', () => {
    const fixture = create({ listMyStudents: () => of([]), listMySessions: () => of([session]) });
    fixture.detectChanges();
    const page = fixture.componentInstance;
    expect(page.student()).toBeNull();
    expect(page.sessions()).toEqual([]);
    expect(page.profileError()).toBeNull();
  });

  it('does not render linked data when the profile request fails', () => {
    const fixture = create({
      listMyStudents: () => throwError(() => new Error('الحساب غير مرتبط')),
      listMySessions: () => of([session]),
    });
    fixture.detectChanges();
    const page = fixture.componentInstance;

    expect(page.student()).toBeNull();
    expect(page.sessions()).toEqual([]);
    expect(page.profileError()).toContain('الحساب غير مرتبط');
  });

  it('filters session records to the backend-linked student', () => {
    const otherSession = { ...session, sessionId: 'session-2', studentId: 'other-student' };
    const fixture = create({ listMyStudents: () => of([linkedStudent]), listMySessions: () => of([session, otherSession]) });
    fixture.detectChanges();
    expect(fixture.componentInstance.sessions().map((item) => item.sessionId)).toEqual(['session-1']);
  });
});
