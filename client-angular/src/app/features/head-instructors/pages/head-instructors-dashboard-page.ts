import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { MadaButton } from '../../../shared/components/button/mada-button';
import { MadaCard } from '../../../shared/components/card/mada-card';
import { MadaFeedbackState } from '../../../shared/components/feedback-state/mada-feedback-state';
import { MadaPageHeader } from '../../../shared/components/page-header/mada-page-header';
import { MadaScopeCard } from '../../../shared/components/scope-card/mada-scope-card';
import {
  MadaSidebar,
  type MadaSidebarItem,
  type MadaSidebarSection,
} from '../../../shared/components/sidebar/mada-sidebar';
import { HeadInstructorsDataService } from '../data-access/head-instructors-data.service';
import type { R03OverviewData, R03OverviewResult } from '../models/head-instructors.models';

type R03View = 'overview' | 'evaluations';

@Component({
  selector: 'mada-head-instructors-dashboard-page',
  standalone: true,
  imports: [
    DecimalPipe,
    LucideDynamicIcon,
    MadaButton,
    MadaCard,
    MadaFeedbackState,
    MadaPageHeader,
    MadaScopeCard,
    MadaSidebar,
  ],
  templateUrl: './head-instructors-dashboard-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeadInstructorsDashboardPage {
  readonly auth = inject(AuthService);
  private readonly dataService = inject(HeadInstructorsDataService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly view = signal<R03View>('overview');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly result = signal<R03OverviewResult | null>(null);
  readonly markingNotificationId = signal<string | null>(null);
  readonly mobileMenuOpen = signal(false);
  readonly isHeadInstructor = computed(() => this.auth.me()?.role === 'R03_HEAD_INSTRUCTORS');
  readonly branchName = computed(() => {
    const me = this.auth.me();
    return me?.branches?.find((branch) => branch.id === me.branchId)?.name ?? 'الفرع المسند';
  });
  readonly displayName = computed(
    () => this.auth.me()?.user?.displayName?.trim() || 'رئيس المدربين',
  );
  readonly data = computed(() => this.result()?.data ?? null);
  readonly activeGroups = computed(
    () =>
      this.data()?.groups.filter(
        (group) => group.status === 'ACTIVE' || group.status === 'UPCOMING',
      ) ?? [],
  );
  readonly upcomingSessions = computed(
    () =>
      this.data()
        ?.sessions.filter(
          (session) =>
            session.status !== 'CANCELLED' && new Date(session.startAt).getTime() >= Date.now(),
        )
        .slice(0, 12) ?? [],
  );
  readonly coachCount = computed(
    () =>
      this.data()?.instructors.filter((instructor) => instructor.roleCode === 'R04_INSTRUCTOR')
        .length ?? 0,
  );
  readonly completedSessions = computed(
    () => this.data()?.sessions.filter((session) => session.status === 'COMPLETED').length ?? 0,
  );
  readonly evaluationStates = [
    { key: 'DRAFT', label: 'مسودة' },
    { key: 'SUBMITTED', label: 'بانتظار المراجعة' },
    { key: 'CHANGES_REQUESTED', label: 'مطلوب تعديل' },
    { key: 'PUBLISHED', label: 'منشور للأسرة' },
  ] as const;
  readonly instructorStats = computed(() => {
    const current = this.data();
    return new Map(
      (current?.instructors ?? []).map((instructor) => [
        instructor.id,
        {
          groups:
            current?.groups.filter((group) => group.instructorId === instructor.id).length ?? 0,
          sessions:
            current?.sessions.filter((session) => session.instructorId === instructor.id).length ??
            0,
        },
      ]),
    );
  });
  readonly sections: readonly MadaSidebarSection[] = [
    {
      label: 'الإشراف الأكاديمي',
      ariaLabel: 'تنقل الإشراف الأكاديمي',
      items: [
        { path: '/head-instructors', label: 'ملخص الفريق', icon: 'layout-dashboard', exact: true },
        { path: '/academic-programs', label: 'البرامج الأكاديمية', icon: 'book-open' },
        { path: '/schedule', label: 'جدول الفريق', icon: 'calendar-days' },
      ],
    },
    {
      label: 'مسارات الإشراف',
      ariaLabel: 'مسارات الإشراف',
      items: [
        { path: '/head-instructors', label: 'مراجعة التقييمات', icon: 'circle-check' },
        { path: '/head-instructors', label: 'فريق المدربين', icon: 'users' },
      ],
    },
  ];
  readonly utilityLinks: readonly MadaSidebarItem[] = [
    { path: '/head-instructors', label: 'اعتماد الحضور', icon: 'circle-check' },
    { actionId: 'logout', label: 'تسجيل الخروج', icon: 'log-out' },
  ];

  constructor() {
    this.load();
  }

  load(): void {
    if (!this.isHeadInstructor() || !this.auth.me()?.branchId) {
      this.loading.set(false);
      this.error.set('حساب رئيس المدربين لا يحتوي على فرع مسند؛ لم يتم عرض بيانات توضيحية.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.dataService
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.result.set(result),
        error: (cause: unknown) => {
          this.result.set(null);
          this.error.set(
            cause instanceof Error ? cause.message : 'تعذر تحميل بيانات الفرع من الخادم.',
          );
        },
        complete: () => this.loading.set(false),
      });
  }

  closeMenu(): void {
    this.mobileMenuOpen.set(false);
  }
  openMenu(): void {
    this.mobileMenuOpen.set(true);
  }
  selectView(view: R03View): void {
    this.view.set(view);
  }

  handleSidebarAction(item: MadaSidebarItem): void {
    if ('actionId' in item && item.actionId === 'logout')
      this.auth.logout().subscribe(() => void this.router.navigateByUrl('/login'));
  }

  markRead(notificationId: string): void {
    this.markingNotificationId.set(notificationId);
    this.dataService
      .markNotificationRead(notificationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const current = this.result();
          if (current)
            this.result.set({
              ...current,
              data: {
                ...current.data,
                notifications: current.data.notifications.filter(
                  (notification) => notification.id !== notificationId,
                ),
              },
            });
        },
        error: (cause: unknown) =>
          this.error.set(cause instanceof Error ? cause.message : 'تعذر تحديث حالة التنبيه.'),
        complete: () => this.markingNotificationId.set(null),
      });
  }

  formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'تاريخ غير متاح'
      : new Intl.DateTimeFormat('ar-EG', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(date);
  }

  formatDateTime(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'موعد غير متاح'
      : new Intl.DateTimeFormat('ar-EG', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
  }

  instructorName(instructorId: string): string {
    return (
      this.data()?.instructors.find((instructor) => instructor.id === instructorId)?.name ??
      'مدرب غير محدد'
    );
  }
}
