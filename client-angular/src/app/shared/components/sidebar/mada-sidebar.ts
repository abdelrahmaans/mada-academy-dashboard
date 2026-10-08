import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { MadaButton } from '../button/mada-button';

export type MadaSidebarIcon =
  | 'layout-dashboard'
  | 'users'
  | 'calendar-days'
  | 'book-open'
  | 'settings'
  | 'user-plus'
  | 'circle-check'
  | 'bar-chart-3'
  | 'wallet'
  | 'building-2'
  | 'graduation-cap'
  | 'circle-help'
  | 'shield-check'
  | 'log-out'
  | 'menu'
  | 'map-pin'
  | 'chevron-down'
  | 'chevron-left'
  | 'x';

export interface MadaSidebarNavigationItem {
  readonly path: string;
  readonly label: string;
  readonly icon: MadaSidebarIcon;
  readonly badge?: string | number;
  readonly exact?: boolean;
  readonly actionId?: never;
}

export interface MadaSidebarActionItem {
  readonly actionId: string;
  readonly label: string;
  readonly icon: MadaSidebarIcon;
  readonly path?: never;
}

export type MadaSidebarItem = MadaSidebarNavigationItem | MadaSidebarActionItem;

export interface MadaSidebarSection {
  readonly label: string;
  readonly ariaLabel: string;
  readonly items: readonly MadaSidebarNavigationItem[];
}

@Component({
  selector: 'mada-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideDynamicIcon, MadaButton],
  templateUrl: './mada-sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MadaSidebar {
  readonly open = input(false);
  readonly ariaLabel = input.required<string>();
  readonly academyName = input('أكاديمية مدى');
  readonly roleLabel = input.required<string>();
  readonly roleCode = input.required<string>();
  readonly homePath = input.required<string>();
  readonly sections = input.required<readonly MadaSidebarSection[]>();
  readonly utilityLinks = input<readonly MadaSidebarItem[]>([]);
  readonly academyIcon = input<MadaSidebarIcon>('graduation-cap');
  readonly brandVariant = input<'mark' | 'graduation'>('mark');
  readonly helpDescription = input('دليل التشغيل');
  readonly versionLabel = input('مدى لإدارة الأكاديميات');
  readonly closed = output<void>();
  readonly itemActivated = output<MadaSidebarItem>();

  protected requestClose(): void {
    this.closed.emit();
  }

  protected activateAction(item: MadaSidebarActionItem): void {
    this.itemActivated.emit(item);
    this.requestClose();
  }
}
