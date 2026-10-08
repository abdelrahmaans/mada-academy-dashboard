import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'mada-page-header',
  standalone: true,
  templateUrl: './mada-page-header.html',
  styleUrl: './mada-page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MadaPageHeader {
  readonly title = input.required<string>();
  readonly eyebrow = input<string | null>(null);
  readonly description = input<string | null>(null);
}
