import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  const router = { createUrlTree: vi.fn((commands: string[]) => commands) };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { authenticated: vi.fn(() => false) } },
        { provide: Router, useValue: router },
      ],
    });
    router.createUrlTree.mockClear();
  });

  it('redirects unauthenticated views to login', () => {
    expect(TestBed.runInInjectionContext(() => authGuard({} as never, {} as never))).toEqual([
      '/login',
    ]);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
