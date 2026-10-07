import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InstructorApiService } from '../data-access/instructor-api.service';
import { InstructorDataService } from '../data-access/instructor-data.service';
import type {
  AttendanceInput,
  AttendanceStatus,
  InstructorAttendance,
  InstructorSession,
  InstructorStudent,
} from '../models/instructor.models';

@Component({
  selector: 'mada-instructor-dashboard-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './instructor-dashboard-page.html',
  styleUrl: './instructor-dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorDashboardPage {
  private readonly dataService = inject(InstructorDataService);
  private readonly api = inject(InstructorApiService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly sessions = signal<readonly InstructorSession[]>([]);
  readonly students = signal<readonly InstructorStudent[]>([]);
  readonly selectedSessionId = signal<string | null>(null);
  readonly attendance = signal<InstructorAttendance | null>(null);
  readonly attendanceLoading = signal(false);
  readonly savingAttendance = signal(false);
  readonly saved = signal(false);

  readonly selectedSession = computed(
    () => this.sessions().find((item) => item.id === this.selectedSessionId()) ?? null,
  );
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
    this.saved.set(false);
    this.attendanceLoading.set(true);
    this.api.getAttendance(sessionId).subscribe({
      next: (value) => {
        this.attendance.set(value);
        this.attendanceLoading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message || 'تعذر تحميل حضور الجلسة');
        this.attendanceLoading.set(false);
      },
    });
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
}
