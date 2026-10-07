import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { MadaBadge } from '../../components/badge/mada-badge';
import { MadaButton } from '../../components/button/mada-button';
import { MadaCard } from '../../components/card/mada-card';
import { MadaFeedbackState } from '../../components/feedback-state/mada-feedback-state';
import { MadaPageHeader } from '../../components/page-header/mada-page-header';
import { MadaScopeCard } from '../../components/scope-card/mada-scope-card';
import {
  MadaSidebar,
  type MadaSidebarItem,
  type MadaSidebarSection,
} from '../../components/sidebar/mada-sidebar';
import { MadaStatusBadge } from '../../components/status-badge/mada-status-badge';

@Component({
  selector: 'mada-shared-components-preview',
  standalone: true,
  imports: [
    LucideDynamicIcon,
    MadaBadge,
    MadaButton,
    MadaCard,
    MadaFeedbackState,
    MadaPageHeader,
    MadaScopeCard,
    MadaSidebar,
    MadaStatusBadge,
  ],
  templateUrl: './shared-components-preview.html',
  styleUrl: './shared-components-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedComponentsPreview {
  protected readonly menuOpen = signal(false);
  protected readonly retryCount = signal(0);

  protected readonly sections: readonly MadaSidebarSection[] = [
    {
      label: 'القائمة الرئيسية',
      ariaLabel: 'القائمة الرئيسية لمدير الفرع — معاينة',
      items: [
        { path: '/', label: 'الرئيسية', icon: 'layout-dashboard', exact: true },
        { path: '/students', label: 'الطلاب', icon: 'users', badge: 248 },
        { path: '/schedule', label: 'الجدول', icon: 'calendar-days' },
        { path: '/classes', label: 'الحصص والكورسات', icon: 'book-open' },
        { path: '/branch-operations', label: 'إدارة التشغيل', icon: 'settings' },
      ],
    },
    {
      label: 'الإدارة',
      ariaLabel: 'قائمة الإدارة لمدير الفرع — معاينة',
      items: [
        { path: '/team', label: 'الفريق والأدوار', icon: 'users' },
        { path: '/supervision-assignments', label: 'متابعة المجموعات', icon: 'user-plus' },
        { path: '/approvals', label: 'الموافقات', icon: 'circle-check' },
        { path: '/reports', label: 'التقارير والتحليلات', icon: 'bar-chart-3' },
      ],
    },
  ];

  protected readonly utilityLinks: readonly MadaSidebarItem[] = [
    { path: '/team', label: 'إدارة الفريق', icon: 'shield-check' },
    { actionId: 'logout', label: 'تسجيل الخروج', icon: 'log-out' },
  ];

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
  protected openMenu(): void {
    this.menuOpen.set(true);
  }
  protected recordRetry(): void {
    this.retryCount.update((count) => count + 1);
  }
}
