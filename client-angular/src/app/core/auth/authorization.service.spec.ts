import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
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
  permissions: ['branch.read', 'sessions.read', 'evaluations.review'],
};

describe('AuthorizationService', () => {
  it('checks backend-provided role and permission keys without trusting route labels', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { me: signal(me) } }],
    });
    const authorization = TestBed.inject(AuthorizationService);

    expect(
      authorization.can({ roles: ['R03_HEAD_INSTRUCTORS'], permissions: ['sessions.read'] }),
    ).toBe(true);
    expect(authorization.can({ roles: ['R02_BRANCH_MANAGER'] })).toBe(false);
    expect(authorization.hasPermission('evaluations.review')).toBe(true);
  });

  it('supports explicit any-permission policies', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { me: signal(me) } }],
    });
    const authorization = TestBed.inject(AuthorizationService);

    expect(
      authorization.can({
        permissions: ['finance.read', 'evaluations.review'],
        requireAllPermissions: false,
      }),
    ).toBe(true);
    expect(authorization.can({ permissions: ['finance.read', 'marketing.write'] })).toBe(false);
  });
});
