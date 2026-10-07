import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { authInterceptor } from './auth.interceptor';
import { apiErrorInterceptor } from './api-error.interceptor';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('mada.angular.refreshToken', 'refresh-old');
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(withInterceptors([authInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  it('refreshes once and retries the original request with the rotated access token', () => {
    httpClient.get('/protected').subscribe((response) => expect(response).toEqual({ ok: true }));
    const initial = http.expectOne('/protected');
    expect(initial.request.headers.has('Authorization')).toBe(false);
    initial.flush('', { status: 401, statusText: 'Unauthorized' });

    const refresh = http.expectOne((request) => request.url.endsWith('/auth/refresh'));
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-old' });
    refresh.flush({
      data: {
        accessToken: 'access-new',
        refreshToken: 'refresh-new',
        tokenType: 'Bearer',
        expiresIn: 900,
      },
    });

    const retry = http.expectOne((request) => request.url.endsWith('/protected'));
    expect(retry.request.headers.get('Authorization')).toBe('Bearer access-new');
    retry.flush({ ok: true });
    expect(sessionStorage.getItem('mada.angular.refreshToken')).toBe('refresh-new');
  });
});
