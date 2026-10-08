import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './login-page';
import { AuthService } from '../../core/auth/auth.service';
import { authInterceptor } from '../../core/http/auth.interceptor';
import type { AuthMe, AuthTokens } from '../../core/auth/auth.models';

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

describe('LoginPage', () => {
  let http: HttpTestingController;
  const router = { navigateByUrl: vi.fn() };

  beforeEach(() => {
    sessionStorage.clear();
    router.navigateByUrl.mockReset();
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        AuthService,
        { provide: Router, useValue: router },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('requires phone and password before making a request', () => {
    const page = TestBed.createComponent(LoginPage).componentInstance;
    page.submit();
    expect(page.submittedError()).toBe('أدخل رقم الهاتف وكلمة المرور.');
    http.expectNone(() => true);
  });

  it('posts the selected account type and enters the authenticated shell', () => {
    const page = TestBed.createComponent(LoginPage).componentInstance;
    page.form.setValue({ accountType: 'parent', phone: '01012345678', password: 'password' });
    page.submit();

    const login = http.expectOne((request) => request.url.endsWith('/auth/login'));
    expect(login.request.body).toEqual({
      phone: '01012345678',
      password: 'password',
      accountType: 'parent',
    });
    login.flush({ data: tokens });
    http.expectOne((request) => request.url.endsWith('/me')).flush({ data: me });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/workspace');
  });
});
