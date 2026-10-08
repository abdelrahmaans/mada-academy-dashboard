import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../auth/auth.service';
import type { AuthMe } from '../auth/auth.models';
import { ENDPOINT_POLICY, endpointPolicyInterceptor } from './endpoint-policy.interceptor';

const r03: AuthMe = {
  id: 'user-1',
  accountType: 'staff',
  role: 'R03_HEAD_INSTRUCTORS',
  tenantId: 'tenant-1',
  branchId: 'branch-1',
  scopeLevel: 'BRANCH',
  permissions: ['sessions.read', 'evaluations.review'],
};
const r06: AuthMe = {
  id: 'accountant-1', accountType: 'staff', role: 'R06_ACCOUNTANT', tenantId: 'tenant-1', branchId: 'branch-1', scopeLevel: 'BRANCH',
  permissions: ['invoices.read', 'invoices.create', 'payments.create', 'payments.evidence.write', 'finance.expenses.read', 'finance.expenses.write', 'finance.expenses.approve', 'reports.read'],
};

describe('endpointPolicyInterceptor', () => {
  it('does not send a request for a role outside the endpoint matrix', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { me: signal(r03) } },
        provideHttpClient(withInterceptors([endpointPolicyInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const httpClient = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);

    httpClient
      .get('/finance/invoices', {
        context: new HttpContext().set(ENDPOINT_POLICY, 'finance.invoices'),
      })
      .subscribe({
        next: () => expect.fail('request should be denied locally'),
        error: (error) => {
          expect(error.status).toBe(403);
          expect(error.code).toBe('CLIENT_ENDPOINT_FORBIDDEN');
        },
      });
    http.expectNone('/finance/invoices');
  });

  it('passes a request when the role belongs to the endpoint group', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { me: signal(r03) } },
        provideHttpClient(withInterceptors([endpointPolicyInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const httpClient = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);

    httpClient
      .get('/scheduling/evaluation-reviews', {
        context: new HttpContext().set(ENDPOINT_POLICY, 'evaluations.review'),
      })
      .subscribe();
    http.expectOne('/scheduling/evaluation-reviews').flush({ data: { items: [] } });
  });

  it('allows R06 mutation policies and blocks a read-only role from them', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { me: signal(r06) } },
        provideHttpClient(withInterceptors([endpointPolicyInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const httpClient = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);
    httpClient.post('/finance/invoices', {}, { context: new HttpContext().set(ENDPOINT_POLICY, 'finance.invoices.write') }).subscribe();
    http.expectOne('/finance/invoices').flush({ data: {} });
  });
});
