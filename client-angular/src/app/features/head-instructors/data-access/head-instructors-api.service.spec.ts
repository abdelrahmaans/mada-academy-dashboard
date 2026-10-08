import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../environments/environment';
import { HeadInstructorsApiService } from './head-instructors-api.service';

describe('HeadInstructorsApiService', () => {
  let http: HttpTestingController;
  let service: HeadInstructorsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HeadInstructorsApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(HeadInstructorsApiService);
  });

  it('uses backend-scoped instructor and group endpoints without branch query parameters', () => {
    service.listGroups().subscribe();
    service.listInstructors().subscribe();
    const groups = http.expectOne(`${environment.apiBaseUrl}/scheduling/groups`);
    const instructors = http.expectOne(`${environment.apiBaseUrl}/scheduling/instructors`);
    expect(groups.request.urlWithParams).not.toContain('branchId');
    expect(instructors.request.urlWithParams).not.toContain('branchId');
    groups.flush({ data: { items: [], total: 0 } });
    instructors.flush({ data: { items: [], total: 0, branchId: 'server-branch' } });
  });

  it('requests sessions only inside the bounded time window', () => {
    service.listSessions('2026-09-01T00:00:00.000Z', '2026-12-01T00:00:00.000Z').subscribe();
    const request = http.expectOne((candidate) => candidate.url.includes('/sessions'));
    expect(request.request.urlWithParams).toContain('from=2026-09-01T00%3A00%3A00.000Z');
    expect(request.request.urlWithParams).toContain('to=2026-12-01T00%3A00%3A00.000Z');
    expect(request.request.urlWithParams).not.toContain('branchId');
    request.flush({
      data: { items: [], total: 0, scopeLevel: 'BRANCH', branchId: 'server-branch' },
    });
  });

  it('reads and decides only the backend-scoped evaluation review resource', () => {
    service.listEvaluationReviews().subscribe();
    const queue = http.expectOne(`${environment.apiBaseUrl}/scheduling/evaluation-reviews`);
    queue.flush({ data: { items: [], total: 0 } });

    service
      .decideEvaluationReview('evaluation-1', 'REQUEST_CHANGES', 'أضف مثالًا عمليًا.')
      .subscribe();
    const decision = http.expectOne(
      `${environment.apiBaseUrl}/scheduling/evaluation-reviews/evaluation-1/decision`,
    );
    expect(decision.request.body).toEqual({
      decision: 'REQUEST_CHANGES',
      note: 'أضف مثالًا عمليًا.',
    });
    expect(decision.request.urlWithParams).not.toContain('branchId');
    decision.flush({
      data: {
        evaluationId: 'evaluation-1',
        sessionId: 'session-1',
        status: 'CHANGES_REQUESTED',
        reviewedAt: '2026-10-07T00:00:00Z',
        publishedAt: null,
      },
    });
  });
});
