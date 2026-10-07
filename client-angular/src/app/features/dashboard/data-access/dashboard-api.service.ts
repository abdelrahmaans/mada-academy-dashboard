import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardSession {
  readonly id: string;
  readonly sessionNumber: number;
  readonly startAt: string;
  readonly status: string;
}

export interface DashboardSummary {
  readonly students: number;
  readonly activeEnrollments: number;
  readonly upcomingSessions: number;
  readonly completedSessions: number;
  readonly branchCount: number;
  readonly upcoming: readonly DashboardSession[];
}

interface ApiEnvelope<T> {
  readonly data: T;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<DashboardSummary> {
    return this.http
      .get<ApiEnvelope<DashboardSummary>>(`${environment.apiBaseUrl}/dashboard/summary`)
      .pipe(map((response) => response.data));
  }
}
