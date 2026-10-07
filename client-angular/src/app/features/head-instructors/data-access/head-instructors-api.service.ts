import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ENDPOINT_POLICY } from '../../../core/http/endpoint-policy.interceptor';
import type { ApiEnvelope } from '../../../core/auth/auth.models';
import type {
  R03EvaluationReview,
  R03EvaluationSummary,
  R03Group,
  R03Instructor,
  R03Notification,
  R03ReviewDecision,
  R03ReviewDecisionResult,
  R03Session,
} from '../models/head-instructors.models';

interface ListEnvelope<T> {
  readonly items: readonly T[];
  readonly total: number;
}

interface SessionsEnvelope {
  readonly items: readonly R03Session[];
  readonly total: number;
  readonly scopeLevel: string;
  readonly branchId: string | null;
}

interface ReviewQueueEnvelope {
  readonly items: readonly R03EvaluationReview[];
  readonly total: number;
}

@Injectable({ providedIn: 'root' })
export class HeadInstructorsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listGroups(): Observable<readonly R03Group[]> {
    return this.http
      .get<ApiEnvelope<ListEnvelope<R03Group>>>(`${this.baseUrl}/scheduling/groups`, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'sessions.read'),
      })
      .pipe(map((response) => response.data.items));
  }

  listInstructors(): Observable<readonly R03Instructor[]> {
    // Branch scope comes from the authenticated JWT; do not send a client-selected branchId.
    return this.http
      .get<ApiEnvelope<ListEnvelope<R03Instructor>>>(`${this.baseUrl}/scheduling/instructors`, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'sessions.read'),
      })
      .pipe(map((response) => response.data.items));
  }

  listSessions(from: string, to: string): Observable<readonly R03Session[]> {
    const query = new URLSearchParams({ from, to });
    return this.http
      .get<ApiEnvelope<SessionsEnvelope>>(`${this.baseUrl}/sessions?${query.toString()}`, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'sessions.read'),
      })
      .pipe(map((response) => response.data.items));
  }

  getEvaluationSummary(): Observable<R03EvaluationSummary> {
    return this.http
      .get<ApiEnvelope<R03EvaluationSummary>>(
        `${this.baseUrl}/scheduling/evaluation-status-summary`,
        { context: new HttpContext().set(ENDPOINT_POLICY, 'evaluations.review') },
      )
      .pipe(map((response) => response.data));
  }

  listEvaluationReviews(): Observable<readonly R03EvaluationReview[]> {
    return this.http
      .get<ApiEnvelope<ReviewQueueEnvelope>>(`${this.baseUrl}/scheduling/evaluation-reviews`, {
        context: new HttpContext().set(ENDPOINT_POLICY, 'evaluations.review'),
      })
      .pipe(map((response) => response.data.items));
  }

  decideEvaluationReview(
    evaluationId: string,
    decision: R03ReviewDecision,
    note?: string,
  ): Observable<R03ReviewDecisionResult> {
    return this.http
      .post<ApiEnvelope<R03ReviewDecisionResult>>(
        `${this.baseUrl}/scheduling/evaluation-reviews/${encodeURIComponent(evaluationId)}/decision`,
        { decision, ...(note === undefined ? {} : { note }) },
        { context: new HttpContext().set(ENDPOINT_POLICY, 'evaluations.review') },
      )
      .pipe(map((response) => response.data));
  }

  listUnreadNotifications(): Observable<readonly R03Notification[]> {
    return this.http
      .get<ApiEnvelope<ListEnvelope<R03Notification>>>(
        `${this.baseUrl}/scheduling/notifications?unreadOnly=true`,
        { context: new HttpContext().set(ENDPOINT_POLICY, 'notifications.read') },
      )
      .pipe(map((response) => response.data.items));
  }

  markNotificationRead(notificationId: string): Observable<void> {
    return this.http
      .post<ApiEnvelope<void>>(
        `${this.baseUrl}/scheduling/notifications/${encodeURIComponent(notificationId)}/read`,
        {},
        { context: new HttpContext().set(ENDPOINT_POLICY, 'notifications.read') },
      )
      .pipe(map(() => undefined));
  }
}
