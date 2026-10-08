import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { FamilyApiService } from '../data-access/family-api.service';
import type { FamilyChild, FamilyInvoice, FamilySession } from '../models/family.models';

@Component({
  selector: 'mada-family-portal-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './family-portal-page.html',
  styleUrl: './family-portal-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyPortalPage {
  private readonly api = inject(FamilyApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly profileError = signal<string | null>(null);
  readonly sessionsWarning = signal<string | null>(null);
  readonly invoicesWarning = signal<string | null>(null);
  readonly children = signal<readonly FamilyChild[]>([]);
  readonly sessions = signal<readonly FamilySession[]>([]);
  readonly invoices = signal<readonly FamilyInvoice[]>([]);
  readonly selectedId = signal<string | null>(null);
  readonly parentName = computed(() => this.auth.me()?.user?.displayName ?? 'ولي الأمر');
  readonly selectedChild = computed(() => this.children().find((child) => child.id === this.selectedId()) ?? this.children()[0] ?? null);
  readonly childSessions = computed(() => {
    const child = this.selectedChild();
    return child ? this.sessions().filter((session) => session.studentId === child.id) : [];
  });
  readonly childInvoices = computed(() => {
    const child = this.selectedChild();
    return child ? this.invoices().filter((invoice) => invoice.studentId === child.id) : [];
  });
  readonly attendanceRate = computed(() => {
    const marked = this.childSessions().filter((session) => session.attendanceStatus !== 'UNMARKED');
    return marked.length ? Math.round(marked.filter((session) => session.attendanceStatus === 'PRESENT' || session.attendanceStatus === 'LATE').length / marked.length * 100) : 0;
  });
  readonly nextSession = computed(() => this.childSessions().filter((session) => session.status !== 'CANCELLED' && new Date(session.startAt).getTime() >= Date.now()).sort((a, b) => a.startAt.localeCompare(b.startAt))[0] ?? null);
  readonly latestEvaluation = computed(() => this.childSessions().filter((session) => session.score !== null && session.score !== undefined).sort((a, b) => b.startAt.localeCompare(a.startAt))[0] ?? null);
  readonly latestEvaluationScore = computed(() => this.latestEvaluation()?.score ?? '—');

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.profileError.set(null);
    this.sessionsWarning.set(null);
    this.invoicesWarning.set(null);
    this.children.set([]);
    this.sessions.set([]);
    this.invoices.set([]);
    forkJoin({
      children: this.api.listMyChildren(),
      sessions: this.api.listMySessions().pipe(catchError((error: unknown) => { this.sessionsWarning.set(this.message(error, 'تعذر تحميل جلسات الأطفال.')); return of([] as readonly FamilySession[]); })),
      invoices: this.api.listMyInvoices().pipe(catchError((error: unknown) => { this.invoicesWarning.set(this.message(error, 'تعذر تحميل فواتير الأطفال.')); return of([] as readonly FamilyInvoice[]); })),
    }).subscribe({
      next: ({ children, sessions, invoices }) => {
        this.children.set(children);
        this.selectedId.set(children.some((child) => child.id === this.selectedId()) ? this.selectedId() : children[0]?.id ?? null);
        this.sessions.set(sessions.filter((session) => children.some((child) => child.id === session.studentId)));
        this.invoices.set(invoices.filter((invoice) => children.some((child) => child.id === invoice.studentId)));
        this.loading.set(false);
      },
      error: (error: unknown) => { this.profileError.set(this.message(error, 'تعذر تحميل الأطفال المرتبطين بحسابك.')); this.loading.set(false); },
    });
  }

  selectChild(id: string): void { if (this.children().some((child) => child.id === id)) this.selectedId.set(id); }

  async logout(): Promise<void> {
    await new Promise<void>((resolve) => this.auth.logout().subscribe({ complete: resolve, error: resolve }));
    await this.router.navigate(['/login']);
  }

  formatStatus(status: FamilySession['status']): string { return status === 'COMPLETED' ? 'مكتملة' : status === 'CANCELLED' ? 'ملغاة' : status === 'IN_PROGRESS' ? 'جارية' : 'قادمة'; }
  formatAttendance(status: FamilySession['attendanceStatus']): string { return { PRESENT: 'حاضر', LATE: 'متأخر', ABSENT: 'غائب', EXCUSED: 'بعذر', UNMARKED: 'لم يسجل' }[status] ?? 'غير معروف'; }
  private message(error: unknown, fallback: string): string { return error instanceof Error && error.message ? error.message : fallback; }
}
