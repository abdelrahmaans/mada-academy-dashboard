import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

export type MadaScopeLevel = 'platform' | 'tenant' | 'branch' | 'assigned' | 'family' | 'self';

const SCOPE_LABELS: Readonly<Record<MadaScopeLevel, string>> = {
  platform: 'المنصة',
  tenant: 'الأكاديمية',
  branch: 'الفرع',
  assigned: 'المهام المعيّنة',
  family: 'الأسرة المرتبطة',
  self: 'حساب الطالب',
};

@Component({
  selector: 'mada-scope-card',
  standalone: true,
  imports: [LucideDynamicIcon],
  templateUrl: './mada-scope-card.html',
  styleUrl: './mada-scope-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MadaScopeCard {
  readonly level = input.required<MadaScopeLevel>();
  readonly scopeName = input.required<string>();
  readonly tenantName = input<string | null>(null);
  readonly compact = input(false);
  readonly demo = input(false);

  protected get levelLabel(): string {
    return SCOPE_LABELS[this.level()];
  }
}
