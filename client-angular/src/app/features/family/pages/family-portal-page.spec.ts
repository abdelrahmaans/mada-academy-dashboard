import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, type Observable } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../core/auth/auth.service';
import type { FamilyChild, FamilyInvoice, FamilySession } from '../models/family.models';
import { FamilyApiService } from '../data-access/family-api.service';
import { FamilyPortalPage } from './family-portal-page';

const linkedChild: FamilyChild = { id: 'child-1', name: 'Youssef Ahmed', branchId: 'branch-1', branchName: 'الفرع الرئيسي', relationship: 'Mother' };
const otherChild: FamilyChild = { id: 'child-2', name: 'Lina Omar', branchId: 'branch-1', branchName: 'الفرع الرئيسي', relationship: 'Mother' };
const publishedSession: FamilySession = { sessionId: 'session-1', studentId: 'child-1', sessionNumber: 3, startAt: '2026-09-26T10:00:00Z', endAt: '2026-09-26T11:30:00Z', status: 'COMPLETED', courseName: 'روبوتكس', classroomName: 'قاعة 1', branchName: 'الفرع الرئيسي', attendanceStatus: 'PRESENT', score: 88, notes: 'تقييم منشور' };
const unpublishedSession: FamilySession = { ...publishedSession, sessionId: 'session-2', studentId: 'child-1', sessionNumber: 2, score: null, notes: null };
const invoice: FamilyInvoice = { id: 'invoice-1', invoiceNumber: 'INV-001', studentId: 'child-1', studentName: linkedChild.name, dueDate: '2026-10-31', totalPiastres: 320000, paidPiastres: 100000, remainingPiastres: 220000, status: 'PARTIALLY_PAID', lines: [], payments: [] };

type ApiMock = {
  listMyChildren: () => Observable<readonly FamilyChild[]>;
  listMySessions: () => Observable<readonly FamilySession[]>;
  listMyInvoices: () => Observable<readonly FamilyInvoice[]>;
};

function create(api: ApiMock): ComponentFixture<FamilyPortalPage> {
  TestBed.configureTestingModule({
    imports: [FamilyPortalPage],
    providers: [
      { provide: FamilyApiService, useValue: api },
      { provide: AuthService, useValue: { me: () => ({ user: { displayName: 'ولي الأمر' } }), logout: () => of(undefined) } },
      { provide: Router, useValue: { navigate: vi.fn() } },
      { provide: ActivatedRoute, useValue: {} },
    ],
  });
  return TestBed.createComponent(FamilyPortalPage);
}

describe('FamilyPortalPage', () => {
  it('keeps linked children visible when sessions and invoices fail independently', () => {
    const fixture = create({ listMyChildren: () => of([linkedChild]), listMySessions: () => throwError(() => new Error('الجلسات غير متاحة')), listMyInvoices: () => throwError(() => new Error('الفواتير غير متاحة')) });
    fixture.detectChanges();
    const page = fixture.componentInstance;
    expect(page.children()).toEqual([linkedChild]);
    expect(page.childSessions()).toEqual([]);
    expect(page.childInvoices()).toEqual([]);
    expect(page.sessionsWarning()).toContain('الجلسات غير متاحة');
    expect(page.invoicesWarning()).toContain('الفواتير غير متاحة');
    expect(page.profileError()).toBeNull();
  });

  it('filters sessions and invoices to linked children and exposes published scores only', () => {
    const foreignSession = { ...publishedSession, sessionId: 'foreign-session', studentId: 'child-2', score: 91 };
    const foreignInvoice = { ...invoice, id: 'foreign-invoice', studentId: 'child-2' };
    const fixture = create({ listMyChildren: () => of([linkedChild]), listMySessions: () => of([publishedSession, unpublishedSession, foreignSession]), listMyInvoices: () => of([invoice, foreignInvoice]) });
    fixture.detectChanges();
    const page = fixture.componentInstance;
    expect(page.children()).toEqual([linkedChild]);
    expect(page.childSessions().map((item) => item.sessionId)).toEqual(['session-1', 'session-2']);
    expect(page.latestEvaluation()?.score).toBe(88);
    expect(page.childSessions().some((item) => item.score === 91)).toBe(false);
    expect(page.childInvoices().map((item) => item.id)).toEqual(['invoice-1']);
  });

  it('switches only to a child returned by the backend', () => {
    const fixture = create({ listMyChildren: () => of([linkedChild, otherChild]), listMySessions: () => of([publishedSession]), listMyInvoices: () => of([]) });
    fixture.detectChanges();
    const page = fixture.componentInstance;
    expect(page.selectedChild()?.id).toBe('child-1');
    page.selectChild('child-2');
    expect(page.selectedChild()?.id).toBe('child-2');
    page.selectChild('not-linked');
    expect(page.selectedChild()?.id).toBe('child-2');
  });

  it('does not invent children when the linked profile request fails', () => {
    const fixture = create({ listMyChildren: () => throwError(() => new Error('الحساب غير مرتبط')), listMySessions: () => of([publishedSession]), listMyInvoices: () => of([invoice]) });
    fixture.detectChanges();
    const page = fixture.componentInstance;
    expect(page.children()).toEqual([]);
    expect(page.childSessions()).toEqual([]);
    expect(page.childInvoices()).toEqual([]);
    expect(page.profileError()).toContain('الحساب غير مرتبط');
  });
});
