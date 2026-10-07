import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../environments/environment';
import { DashboardApiService } from './dashboard-api.service';

describe('DashboardApiService', () => {
  let http: HttpTestingController;
  let service: DashboardApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(DashboardApiService);
  });

  it('reads the backend envelope without adding tenant or branch query parameters', () => {
    const received: unknown[] = [];
    service.getSummary().subscribe((summary) => received.push(summary));
    const request = http.expectOne(`${environment.apiBaseUrl}/dashboard/summary`);
    expect(request.request.method).toBe('GET');
    expect(request.request.urlWithParams).not.toContain('tenantId');
    expect(request.request.urlWithParams).not.toContain('branchId');
    request.flush({
      data: {
        students: 2,
        activeEnrollments: 3,
        upcomingSessions: 1,
        completedSessions: 4,
        branchCount: 1,
        upcoming: [],
      },
    });
    expect(received[0]).toEqual({
      students: 2,
      activeEnrollments: 3,
      upcomingSessions: 1,
      completedSessions: 4,
      branchCount: 1,
      upcoming: [],
    });
  });
});
