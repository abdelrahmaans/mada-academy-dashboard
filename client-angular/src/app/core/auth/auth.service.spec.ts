import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { authInterceptor } from '../http/auth.interceptor';
import type { AuthMe, AuthTokens } from './auth.models';

const tokens: AuthTokens = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  tokenType: 'Bearer',
  expiresIn: 900,
};
const me: AuthMe = {
  id: 'user-1',
  accountType: 'staff',
  role: 'R02_BRANCH_MANAGER',
  tenantId: 'tenant-1',
  branchId: 'branch-1',
  scopeLevel: 'BRANCH',
};

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('logs in, loads the backend identity, and keeps refresh only in session storage', () => {
    auth.login('01012345678', 'password', 'staff').subscribe();
    const login = http.expectOne((request) => request.url.endsWith('/auth/login'));
    expect(login.request.body).toEqual({
      phone: '01012345678',
      password: 'password',
      accountType: 'staff',
    });
    login.flush({ data: tokens });
    const meRequest = http.expectOne((request) => request.url.endsWith('/me'));
    expect(meRequest.request.headers.get('Authorization')).toBe('Bearer access-1');
    meRequest.flush({ data: me });

    expect(auth.me()).toEqual(me);
    expect(sessionStorage.getItem('mada.angular.refreshToken')).toBe('refresh-1');
    expect(localStorage.getItem('mada.angular.refreshToken')).toBeNull();
  });

  it('shares concurrent refresh calls and stores the rotated token once', () => {
    sessionStorage.setItem('mada.angular.refreshToken', 'refresh-old');
    const first = auth.refresh();
    const second = auth.refresh();
    expect(first).toBe(second);
    first.subscribe();
    second.subscribe();

    const refresh = http.expectOne((request) => request.url.endsWith('/auth/refresh'));
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-old' });
    refresh.flush({ data: { ...tokens, accessToken: 'access-2', refreshToken: 'refresh-2' } });

    expect(auth.accessToken()).toBe('access-2');
    expect(sessionStorage.getItem('mada.angular.refreshToken')).toBe('refresh-2');
  });
});
