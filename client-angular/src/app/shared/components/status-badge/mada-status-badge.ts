import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MadaBadge, type MadaBadgeTone } from '../badge/mada-badge';

const ARABIC_STATUS_LABELS: Readonly<Record<string, string>> = {
  DRAFT: 'مسودة',
  PENDING: 'قيد الانتظار',
  PENDING_APPROVAL: 'بانتظار الاعتماد',
  APPROVED: 'معتمد',
  REJECTED: 'مرفوض',
  LOCKED: 'مقفل',
  CANCELLED: 'ملغى',
  COMPLETED: 'مكتمل',
  NEEDS_REVIEW: 'يحتاج مراجعة',
  FAILED: 'فشل',
  DISABLED: 'غير متاح',
  IN_PROGRESS: 'جارية',
  SCHEDULED: 'مجدولة',
  ACTIVE: 'نشطة',
  TRIAL: 'تجريبية',
  SETUP: 'تحتاج استكمالًا',
  PAUSED: 'معلّقة',
  SUCCESS: 'ناجح',
  WARNING: 'تحذير',
  ERROR: 'خطأ',
};

const SUCCESS_STATUSES = new Set([
  'ACTIVE',
  'APPROVED',
  'COMPLETED',
  'PUBLISHED',
  'PAID',
  'SUCCESS',
]);
const WARNING_STATUSES = new Set([
  'PENDING',
  'PENDING_APPROVAL',
  'DRAFT',
  'NEEDS_REVIEW',
  'IN_PROGRESS',
  'SCHEDULED',
  'TRIAL',
  'SETUP',
  'PAUSED',
  'WARNING',
]);
const DANGER_STATUSES = new Set([
  'REJECTED',
  'FAILED',
  'CANCELLED',
  'DISABLED',
  'ERROR',
  'OVERDUE',
]);

@Component({
  selector: 'mada-status-badge',
  standalone: true,
  imports: [MadaBadge],
  templateUrl: './mada-status-badge.html',
  styleUrl: './mada-status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-status]': 'normalizedStatus()' },
})
export class MadaStatusBadge {
  readonly status = input.required<string>();
  readonly labelOverride = input<string | null>(null);

  readonly normalizedStatus = computed(() =>
    this.status().trim().toUpperCase().replace(/\s+/g, '_'),
  );
  readonly label = computed(
    () => this.labelOverride() ?? ARABIC_STATUS_LABELS[this.normalizedStatus()] ?? this.status(),
  );
  readonly tone = computed<MadaBadgeTone>(() => {
    const status = this.normalizedStatus();
    if (SUCCESS_STATUSES.has(status)) return 'success';
    if (WARNING_STATUSES.has(status)) return 'warning';
    if (DANGER_STATUSES.has(status)) return 'danger';
    return 'neutral';
  });
}
