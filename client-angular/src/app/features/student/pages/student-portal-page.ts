import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { StudentApiService } from '../data-access/student-api.service';
import type { ConsumerSession, ConsumerStudent } from '../models/student.models';

@Component({
  selector: 'mada-student-portal-page',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './student-portal-page.html',
  styleUrl: './student-portal-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentPortalPage {
  private readonly api = inject(StudentApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly profileError = signal<string | null>(null);
  readonly sessionsWarning = signal<string | null>(null);
  readonly student = signal<ConsumerStudent | null>(null);
  readonly sessions = signal<readonly ConsumerSession[]>([]);
  readonly studentName = computed(() => this.student()?.name ?? this.auth.me()?.user?.displayName ?? 'الطالب');
  readonly completedSessions = computed(() => this.sessions().filter((item) => item.status === 'COMPLETED').length);
  readonly attendanceRate = computed(() => {
    const marked = this.sessions().filter((item) => item.attendanceStatus !== 'UNMARKED');
    if (!marked.length) return 0;
    return Math.round(marked.filter((item) => item.attendanceStatus === 'PRESENT' || item.attendanceStatus === 'LATE').length / marked.length * 100);
  });
  readonly nextSession = computed(() => this.sessions().filter((item) => item.status !== 'CANCELLED' && new Date(item.startAt).getTime() >= Date.now()).sort((a, b) => a.startAt.localeCompare(b.startAt))[0] ?? null);
  readonly latestEvaluation = computed(() => this.sessions().filter((item) => item.score !== null && item.score !== undefined).sort((a, b) => b.startAt.localeCompare(a.startAt))[0] ?? null);
  readonly latestEvaluationScore = computed(() => this.latestEvaluation()?.score ?? '—');

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.profileError.set(null);
    this.sessionsWarning.set(null);
    this.sessions.set([]);
    forkJoin({
      students: this.api.listMyStudents(),
      sessions: this.api.listMySessions().pipe(catchError((error: unknown) => {
        this.sessionsWarning.set(this.message(error, 'تعذر تحميل جلسات الطالب.'));
        return of([] as readonly ConsumerSession[]);
      })),
    }).subscribe({
      next: ({ students, sessions }) => {
        this.student.set(students[0] ?? null);
        this.sessions.set(students[0] ? sessions.filter((item) => item.studentId === students[0].id) : []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.student.set(null);
        this.profileError.set(this.message(error, 'تعذر تحميل ملف الطالب.'));
        this.loading.set(false);
      },
    });
  }

  async logout(): Promise<void> {
    await new Promise<void>((resolve) => this.auth.logout().subscribe({ complete: resolve, error: resolve }));
    await this.router.navigate(['/login']);
  }

  formatStatus(status: ConsumerSession['status']): string {
    return status === 'COMPLETED' ? 'مكتملة' : status === 'CANCELLED' ? 'ملغاة' : status === 'IN_PROGRESS' ? 'جارية' : 'قادمة';
  }

  formatAttendance(status: ConsumerSession['attendanceStatus']): string {
    return { PRESENT: 'حاضر', LATE: 'متأخر', ABSENT: 'غائب', EXCUSED: 'بعذر', UNMARKED: 'لم يسجل' }[status];
  }

  private message(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }
}
