import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { authorizationGuard } from './authorization.guard';
import { AuthService } from './auth.service';
import { AuthorizationService } from './authorization.service';
import type { AuthMe } from './auth.models';

const me: AuthMe = {
  id: 'user-1',
  accountType: 'staff',
  role: 'R03_HEAD_INSTRUCTORS',
  tenantId: 'tenant-1',
  branchId: 'branch-1',
  scopeLevel: 'BRANCH',
  permissions: ['sessions.read', 'evaluations.review'],
};

describe('authorizationGuard', () => {
  it('allows a route when role and all permissions come from /me', () => {
    const auth = { me: signal(me), initialized: () => true, authenticated: () => true };
    const router = { createUrlTree: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        AuthorizationService,
        { provide: Router, useValue: router },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authorizationGuard(
        {
          data: {
            authorization: { roles: ['R03_HEAD_INSTRUCTORS'], permissions: ['sessions.read'] },
          },
        } as never,
        {} as never,
      ),
    );

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects a role without the route permission to a safe workspace', () => {
    const auth = { me: signal(me), initialized: () => true, authenticated: () => true };
    const router = {
      createUrlTree: vi.fn((commands: string[], extras: unknown) => ({ commands, extras })),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        AuthorizationService,
        { provide: Router, useValue: router },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authorizationGuard(
        {
          data: {
            authorization: { roles: ['R03_HEAD_INSTRUCTORS'], permissions: ['finance.read'] },
          },
        } as never,
        {} as never,
      ),
    );

    expect(result).toEqual({
      commands: ['/workspace'],
      extras: { queryParams: { reason: 'forbidden' } },
    });
  });

  it('waits for restore before deciding a route', () => {
    const auth = {
      me: signal(me),
      initialized: () => false,
      authenticated: () => true,
      restoreSession: vi.fn(() => of(me)),
    };
    const router = { createUrlTree: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        AuthorizationService,
        { provide: Router, useValue: router },
      ],
    });

    const result$ = TestBed.runInInjectionContext(() =>
      authorizationGuard(
        { data: { authorization: { roles: ['R03_HEAD_INSTRUCTORS'] } } } as never,
        {} as never,
      ),
    );

    expect(auth.restoreSession).toHaveBeenCalledOnce();
    expect(result$).toBeDefined();
  });
});
