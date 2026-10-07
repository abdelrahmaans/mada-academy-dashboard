import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly foundations = signal([
    'Standalone components وواجهات مبنية على الميزات',
    'Signals للحالة المحلية وOnPush لاكتشاف التغييرات',
    'العربية وRTL افتراضيًا مع الحفاظ على هوية Mada',
    'React يظل النسخة المرجعية أثناء التوازي',
  ]);
}
