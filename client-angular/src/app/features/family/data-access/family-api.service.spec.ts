import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../../../core/auth/auth.service';
import type { AuthMe } from '../../../core/auth/auth.models';
import { endpointPolicyInterceptor } from '../../../core/http/endpoint-policy.interceptor';
import { FamilyApiService } from './family-api.service';

const parent: AuthMe = { id: 'parent-account-1', accountType: 'parent', role: 'R08_PARENT', tenantId: 'tenant-1', branchId: null, scopeLevel: 'TENANT', permissions: ['consumer.sessions.read'] };

describe('FamilyApiService', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { me: () => parent } },
        provideHttpClient(withInterceptors([endpointPolicyInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    return { api: TestBed.inject(FamilyApiService), http: TestBed.inject(HttpTestingController) };
  }

  it('loads linked children and sessions without client-selected scope', () => {
    const { api, http } = setup();
    api.listMyChildren().subscribe((items) => expect(items[0].id).toBe('child-1'));
    const childrenRequest = http.expectOne((request) => request.url.endsWith('/api/v1/consumer/me/students'));
    expect(childrenRequest.request.urlWithParams).not.toMatch(/studentId|tenantId|branchId/);
    childrenRequest.flush({ data: { items: [{ id: 'child-1', name: 'طفل مرتبط', branchId: 'branch-1', relationship: 'Mother' }], total: 1 } });

    api.listMySessions().subscribe((items) => expect(items[0].studentId).toBe('child-1'));
    const sessionsRequest = http.expectOne((request) => request.url.endsWith('/api/v1/consumer/me/sessions'));
    expect(sessionsRequest.request.urlWithParams).not.toMatch(/studentId|tenantId|branchId/);
    sessionsRequest.flush({ data: { items: [{ sessionId: 'session-1', studentId: 'child-1', sessionNumber: 1, startAt: '2026-10-07T10:00:00Z', endAt: '2026-10-07T11:00:00Z', status: 'COMPLETED', attendanceStatus: 'PRESENT', score: 88, notes: 'منشور' }], total: 1 } });
  });

  it('reads consumer invoices through the invoice policy without exposing a write surface', () => {
    const { api, http } = setup();
    api.listMyInvoices().subscribe((items) => expect(items[0].invoiceNumber).toBe('INV-001'));
    const request = http.expectOne((item) => item.url.endsWith('/api/v1/consumer/invoices'));
    expect(request.request.method).toBe('GET');
    expect(request.request.urlWithParams).not.toMatch(/studentId|tenantId|branchId/);
    request.flush({ data: { items: [{ id: 'invoice-1', invoiceNumber: 'INV-001', studentId: 'child-1', dueDate: '2026-10-31', totalPiastres: 1000, paidPiastres: 500, remainingPiastres: 500, status: 'PARTIALLY_PAID', lines: [], payments: [] }], total: 1 } });
  });
});
