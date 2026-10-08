import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { DashboardApiService, type DashboardSummary } from '../data-access/dashboard-api.service';
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

@Component({
  selector: 'mada-branch-dashboard-page',
  standalone: true,
  imports: [
    LucideDynamicIcon,
    DecimalPipe,
    MadaButton,
    MadaCard,
    MadaFeedbackState,
    MadaPageHeader,
    MadaScopeCard,
    MadaSidebar,
  ],
  templateUrl: './branch-dashboard-page.html',
  styleUrl: './branch-dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchDashboardPage {
  readonly auth = inject(AuthService);
  private readonly api = inject(DashboardApiService);
  private readonly router = inject(Router);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly mobileMenuOpen = signal(false);
  readonly isBranchManager = computed(() => this.auth.me()?.role === 'R02_BRANCH_MANAGER');
  readonly branchName = computed(
    () =>
      this.auth.me()?.branches?.find((branch) => branch.id === this.auth.me()?.branchId)?.name ??
      'الفرع المحدد',
  );
  readonly displayName = computed(() => this.auth.me()?.user?.displayName?.trim() || 'مدير الفرع');
  readonly sections: readonly MadaSidebarSection[] = [
    {
      label: 'القائمة الرئيسية',
      ariaLabel: 'القائمة الرئيسية لمدير الفرع',
      items: [
        { path: '/', label: 'الرئيسية', icon: 'layout-dashboard', exact: true },
        { path: '/students', label: 'الطلاب', icon: 'users' },
        { path: '/schedule', label: 'الجدول', icon: 'calendar-days' },
        { path: '/classes', label: 'الحصص والكورسات', icon: 'book-open' },
        { path: '/branch-operations', label: 'إدارة التشغيل', icon: 'settings' },
      ],
    },
    {
      label: 'الإدارة',
      ariaLabel: 'قائمة الإدارة لمدير الفرع',
      items: [
        { path: '/team', label: 'الفريق والأدوار', icon: 'users' },
        { path: '/supervision-assignments', label: 'متابعة المجموعات', icon: 'user-plus' },
        { path: '/approvals', label: 'الموافقات', icon: 'circle-check' },
        { path: '/reports', label: 'التقارير والتحليلات', icon: 'bar-chart-3' },
      ],
    },
  ];
  readonly utilityLinks: readonly MadaSidebarItem[] = [
    { path: '/team', label: 'إدارة الفريق', icon: 'shield-check' },
    { actionId: 'logout', label: 'تسجيل الخروج', icon: 'log-out' },
  ];

  constructor() {
    if (this.isBranchManager()) this.load();
    else this.loading.set(false);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getSummary().subscribe({
      next: (summary) => this.summary.set(summary),
      error: (cause: unknown) => {
        this.summary.set(null);
        this.error.set(cause instanceof Error ? cause.message : 'تعذر تحميل بيانات الفرع.');
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

  handleSidebarAction(item: MadaSidebarItem): void {
    if ('actionId' in item && item.actionId === 'logout') {
      this.auth.logout().subscribe(() => void this.router.navigateByUrl('/login'));
    }
  }

  go(path: string): void {
    this.closeMenu();
    void this.router.navigateByUrl(path);
  }

  formatSessionTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'موعد الجلسة غير متاح';
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
