import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, of, type Observable } from 'rxjs';
import { HeadInstructorsApiService } from './head-instructors-api.service';
import type {
  R03EvaluationReview,
  R03EvaluationSummary,
  R03LoadWarning,
  R03OverviewResult,
  R03ReviewDecision,
  R03ReviewDecisionResult,
} from '../models/head-instructors.models';

const EMPTY_EVALUATIONS: R03EvaluationSummary = {
  branchId: '',
  counts: { DRAFT: 0, SUBMITTED: 0, CHANGES_REQUESTED: 0, PUBLISHED: 0 },
};

@Injectable({ providedIn: 'root' })
export class HeadInstructorsDataService {
  private readonly api = inject(HeadInstructorsApiService);

  load(): Observable<R03OverviewResult> {
    const { from, to } = this.window();
    return forkJoin({
      // These are the core R03 overview sources. Any failure fails the whole load.
      groups: this.api.listGroups(),
      instructors: this.api.listInstructors(),
      sessions: this.api.listSessions(from, to),
      evaluations: this.optional(
        this.api.getEvaluationSummary(),
        'evaluations',
        'ملخص التقييمات غير متاح مؤقتًا.',
      ),
      notifications: this.optional(
        this.api.listUnreadNotifications(),
        'notifications',
        'التنبيهات غير متاحة مؤقتًا.',
      ),
    }).pipe(
      map(({ groups, instructors, sessions, evaluations, notifications }) => ({
        data: {
          groups,
          instructors,
          sessions,
          evaluations: evaluations.value,
          notifications: notifications.value,
        },
        warnings: [evaluations.warning, notifications.warning].filter(
          (warning): warning is R03LoadWarning => warning !== null,
        ),
      })),
    );
  }

  markNotificationRead(notificationId: string): Observable<void> {
    return this.api.markNotificationRead(notificationId);
  }

  listEvaluationReviews(): Observable<readonly R03EvaluationReview[]> {
    return this.api.listEvaluationReviews();
  }

  decideEvaluationReview(
    evaluationId: string,
    decision: R03ReviewDecision,
    note?: string,
  ): Observable<R03ReviewDecisionResult> {
    return this.api.decideEvaluationReview(evaluationId, decision, note);
  }

  private optional<T>(request$: Observable<T>, source: R03LoadWarning['source'], message: string) {
    return request$.pipe(
      map((value) => ({ value, warning: null as R03LoadWarning | null })),
      catchError(() =>
        of({
          value: source === 'evaluations' ? (EMPTY_EVALUATIONS as T) : ([] as T),
          warning: { source, message },
        }),
      ),
    );
  }

  private window(): { from: string; to: string } {
    const now = Date.now();
    return {
      from: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date(now + 60 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}
