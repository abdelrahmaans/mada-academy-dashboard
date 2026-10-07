import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type MadaCardSurface = 'panel' | 'tile' | 'flat';
export type MadaCardPadding = 'default' | 'compact' | 'none';

@Component({
  selector: 'mada-card',
  standalone: true,
  templateUrl: './mada-card.html',
  styleUrl: './mada-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MadaCard {
  readonly surface = input<MadaCardSurface>('panel');
  readonly padding = input<MadaCardPadding>('default');
  readonly label = input<string | null>(null);
}
