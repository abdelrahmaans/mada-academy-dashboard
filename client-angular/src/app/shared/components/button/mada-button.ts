import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type MadaButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type MadaButtonSize = 'default' | 'compact' | 'icon';
export type MadaButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'mada-button',
  standalone: true,
  templateUrl: './mada-button.html',
  styleUrl: './mada-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MadaButton {
  readonly variant = input<MadaButtonVariant>('primary');
  readonly size = input<MadaButtonSize>('default');
  readonly type = input<MadaButtonType>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly ariaLabel = input<string | null>(null);
  readonly clicked = output<MouseEvent>();

  protected readonly unavailable = computed(() => this.disabled() || this.loading());

  protected onClick(event: MouseEvent): void {
    if (!this.unavailable()) this.clicked.emit(event);
  }
}
