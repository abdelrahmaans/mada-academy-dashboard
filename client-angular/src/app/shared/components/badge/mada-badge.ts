import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type MadaBadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

@Component({
  selector: 'mada-badge',
  standalone: true,
  templateUrl: './mada-badge.html',
  styleUrl: './mada-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MadaBadge {
  readonly tone = input<MadaBadgeTone>('neutral');
  readonly label = input<string | null>(null);
}
