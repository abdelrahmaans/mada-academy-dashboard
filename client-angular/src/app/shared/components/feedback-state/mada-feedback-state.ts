import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MadaButton } from '../button/mada-button';

export type MadaFeedbackKind = 'loading' | 'empty' | 'error' | 'locked' | 'success';

@Component({
  selector: 'mada-feedback-state',
  standalone: true,
  imports: [MadaButton],
  templateUrl: './mada-feedback-state.html',
  styleUrl: './mada-feedback-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MadaFeedbackState {
  readonly kind = input<MadaFeedbackKind>('empty');
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly retryLabel = input('إعادة المحاولة');
  readonly retry = output<void>();
}
