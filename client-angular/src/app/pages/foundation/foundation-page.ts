import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MadaButton } from '../../shared/components/button/mada-button';

@Component({
  selector: 'mada-foundation-page',
  standalone: true,
  imports: [RouterLink, MadaButton],
  templateUrl: './foundation-page.html',
  styleUrl: './foundation-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationPage {
  protected readonly principles = [
    'Standalone components وواجهات مبنية على الميزات',
    'Signals للحالة المحلية وOnPush لاكتشاف التغييرات',
    'العربية وRTL افتراضيًا مع الحفاظ على هوية Mada',
    'React يظل النسخة المرجعية أثناء التوازي',
  ];
}
