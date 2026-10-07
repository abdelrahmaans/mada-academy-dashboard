import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { InstructorApiService } from '../data-access/instructor-api.service';
import { InstructorDataService } from '../data-access/instructor-data.service';
import type {
  AttendanceInput,
  AttendanceStatus,
  InstructorAttendance,
  InstructorSession,
  InstructorStudent,
  SessionEvaluation,
} from '../models/instructor.models';

@Component({
  selector: 'mada-instructor-dashboard-page',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './instructor-dashboard-page.html',
  styleUrl: './instructor-dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorDashboardPage {
  private readonly dataService = inject(InstructorDataService);
  private readonly api = inject(InstructorApiService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly feedback = signal<string | null>(null);
  readonly sessions = signal<readonly InstructorSession[]>([]);
  readonly students = signal<readonly InstructorStudent[]>([]);
  readonly selectedSessionId = signal<string | null>(null);
  readonly attendance = signal<InstructorAttendance | null>(null);
  readonly attendanceLoading = signal(false);
  readonly savingAttendance = signal(false);
  readonly saved = signal(false);
  readonly evaluations = signal<readonly SessionEvaluation[]>([]);
  readonly evaluationsLoading = signal(false);
  readonly savingEvaluation = signal(false);
  readonly submittingEvaluation = signal(false);
  readonly selectedStudentId = signal<string | null>(null);
  readonly evaluationScore = signal<number | null>(null);
  readonly evaluationNotes = signal('');
  readonly substitutionReason = signal('');
  readonly substitutionLoading = signal(false);
  readonly substitutionSent = signal(false);

  readonly selectedSession = computed(
    () => this.sessions().find((item) => item.id === this.selectedSessionId()) ?? null,
  );
  readonly selectedStudent = computed(
    () => this.attendance()?.items.find((item) => item.studentId === this.selectedStudentId()) ?? null,
  );
  readonly selectedEvaluation = computed(
    () => this.evaluations().find((item) => item.studentId === this.selectedStudentId()) ?? null,
  );
  readonly canEditEvaluation = computed(() => {
    const status = this.selectedEvaluation()?.status;
    return status !== 'SUBMITTED' && status !== 'PUBLISHED';
  });
  readonly canSubmitEvaluation = computed(
    () => this.evaluationScore() !== null && this.evaluationNotes().trim().length > 0,
  );
  readonly canCompleteSession = computed(() => {
    const session = this.selectedSession();
    return Boolean(
      session &&
        session.status !== 'COMPLETED' &&
        session.status !== 'CANCELLED' &&
        this.attendance() &&
        this.attendanceStats().unmarked === 0 &&
        new Date(session.endAt).getTime() <= Date.now(),
    );
  });
  readonly attendanceStats = computed(() => {
    const items = this.attendance()?.items ?? [];
    return {
      present: items.filter((item) => item.status === 'PRESENT').length,
      late: items.filter((item) => item.status === 'LATE').length,
      absent: items.filter((item) => item.status === 'ABSENT' || item.status === 'EXCUSED').length,
      unmarked: items.filter((item) => item.status === 'UNMARKED').length,
    };
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.feedback.set(null);
    this.dataService.loadWorkspace().subscribe({
      next: (workspace) => {
        this.sessions.set(workspace.sessions);
        this.students.set(workspace.students);
        const first = workspace.sessions[0];
        if (first) this.selectSession(first.id);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message || 'تعذر تحميل جلسات المدرب');
        this.loading.set(false);
      },
    });
  }

  selectSession(sessionId: string): void {
    this.selectedSessionId.set(sessionId);
    this.feedback.set(null);
    this.saved.set(false);
    this.substitutionReason.set('');
    this.substitutionSent.set(false);
    this.attendanceLoading.set(true);
    this.evaluationsLoading.set(true);
    this.api.getAttendance(sessionId).subscribe({
      next: (value) => {
        this.attendance.set(value);
        if (!this.selectedStudentId() || !value.items.some((item) => item.studentId === this.selectedStudentId())) {
          this.selectedStudentId.set(value.items[0]?.studentId ?? null);
        }
        this.attendanceLoading.set(false);
        this.syncEvaluationForm();
      },
      error: (error: Error) => {
        this.error.set(error.message || 'تعذر تحميل حضور الجلسة');
        this.attendanceLoading.set(false);
      },
    });
    this.api.listEvaluations(sessionId).subscribe({
      next: (value) => {
        this.evaluations.set(value);
        this.evaluationsLoading.set(false);
        this.syncEvaluationForm();
      },
      error: (error: Error) => {
        this.error.set(error.message || 'تعذر تحميل تقييمات الجلسة');
        this.evaluationsLoading.set(false);
      },
    });
  }

  selectStudent(studentId: string): void {
    this.selectedStudentId.set(studentId);
    this.syncEvaluationForm();
  }

  private syncEvaluationForm(): void {
    const item = this.selectedEvaluation();
    this.evaluationScore.set(item?.score ?? null);
    this.evaluationNotes.set(item?.notes ?? '');
  }

  setAttendance(studentId: string, status: AttendanceStatus): void {
    if (status === 'UNMARKED') return;
    const current = this.attendance();
    if (!current) return;
    this.attendance.set({
      ...current,
      items: current.items.map((item) =>
        item.studentId === studentId
          ? { ...item, status, lateMinutes: status === 'LATE' ? (item.lateMinutes ?? 1) : null }
          : item,
      ),
    });
    this.saved.set(false);
  }

  saveAttendance(): void {
    const session = this.selectedSession();
    const current = this.attendance();
    if (!session || !current || this.attendanceStats().unmarked > 0) {
      this.error.set('يجب تسجيل حالة كل طالب قبل الحفظ');
      return;
    }
    const records: AttendanceInput[] = current.items.map((item) => ({
      studentId: item.studentId,
      status: item.status as Exclude<AttendanceStatus, 'UNMARKED'>,
      lateMinutes: item.status === 'LATE' ? (item.lateMinutes ?? 1) : null,
    }));
    this.savingAttendance.set(true);
    this.error.set(null);
    this.api.saveAttendance(session.id, records).subscribe({
      next: (value) => {
        this.attendance.set(value);
        this.saved.set(true);
        this.savingAttendance.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message || 'تعذر حفظ الحضور');
        this.savingAttendance.set(false);
      },
    });
  }

  saveEvaluation(): void {
    const session = this.selectedSession();
    const studentId = this.selectedStudentId();
    if (!session || !studentId || this.evaluationScore() === null || !this.evaluationNotes().trim()) {
      this.error.set('أدخل الدرجة والملاحظة قبل حفظ التقييم');
      return;
    }
    this.savingEvaluation.set(true);
    this.error.set(null);
    this.api.saveEvaluations(session.id, [{ studentId, score: this.evaluationScore(), notes: this.evaluationNotes().trim() }]).subscribe({
      next: () => {
        this.savingEvaluation.set(false);
        this.reloadEvaluations(session.id, 'تم حفظ التقييم كمسودة');
      },
      error: (error: Error) => {
        this.error.set(error.message || 'تعذر حفظ التقييم');
        this.savingEvaluation.set(false);
      },
    });
  }

  submitEvaluation(): void {
    const session = this.selectedSession();
    const studentId = this.selectedStudentId();
    if (!session || !studentId || !this.canSubmitEvaluation()) {
      this.error.set('أكمل الدرجة والملاحظة قبل الإرسال للمراجعة');
      return;
    }
    this.submittingEvaluation.set(true);
    this.error.set(null);
    this.api
      .saveEvaluations(session.id, [{ studentId, score: this.evaluationScore(), notes: this.evaluationNotes().trim() }])
      .pipe(switchMap(() => this.api.submitEvaluations(session.id, [studentId])))
      .subscribe({
        next: () => {
        this.submittingEvaluation.set(false);
        this.reloadEvaluations(session.id, 'تم إرسال التقييم لرئيس المدربين للمراجعة');
        },
        error: (error: Error) => {
          this.error.set(error.message || 'تعذر إرسال التقييم للمراجعة');
          this.submittingEvaluation.set(false);
        },
      });
  }

  completeSession(): void {
    const session = this.selectedSession();
    if (!session || !this.canCompleteSession()) return;
    this.api.completeSession(session.id).subscribe({
      next: () => {
        this.sessions.update((items) => items.map((item) => item.id === session.id ? { ...item, status: 'COMPLETED' } : item));
      },
      error: (error: Error) => this.error.set(error.message || 'تعذر إتمام الجلسة'),
    });
  }

  requestSubstitution(): void {
    const session = this.selectedSession();
    const reason = this.substitutionReason().trim();
    if (!session || !reason) {
      this.error.set('اكتب سبب طلب المدرب البديل أولًا');
      return;
    }
    this.substitutionLoading.set(true);
    this.error.set(null);
    this.api.requestSubstitution(session.id, reason).subscribe({
      next: () => {
        this.substitutionLoading.set(false);
        this.substitutionReason.set('');
        this.substitutionSent.set(true);
        this.feedback.set('تم إرسال طلب المدرب البديل للمراجعة');
      },
      error: (error: Error) => {
        this.error.set(error.message || 'تعذر إرسال طلب المدرب البديل');
        this.substitutionLoading.set(false);
      },
    });
  }

  private reloadEvaluations(sessionId: string, successMessage: string): void {
    this.api.listEvaluations(sessionId).subscribe({
      next: (items) => {
        this.evaluations.set(items);
        this.syncEvaluationForm();
        this.feedback.set(successMessage);
      },
      error: (error: Error) => this.error.set(error.message || 'تعذر إعادة تحميل التقييمات'),
    });
  }
}
