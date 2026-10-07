import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  catchError,
  finalize,
  map,
  type Observable,
  of,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { NO_REFRESH, SKIP_AUTH } from '../http/auth.interceptor';
import type { AccountType, ApiEnvelope, ApiProblem, AuthMe, AuthTokens } from './auth.models';
import { AuthApiError } from './auth.models';
import { TokenStore } from './token-store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStore);
  private readonly meState = signal<AuthMe | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private refreshRequest$: Observable<boolean> | null = null;

  readonly me = this.meState.asReadonly();
  readonly accessToken = this.tokens.accessToken;
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly authenticated = computed(() => this.meState() !== null);

  login(phone: string, password: string, accountType: AccountType): Observable<AuthMe> {
    this.loadingState.set(true);
    this.errorState.set(null);
    return this.http
      .post<ApiEnvelope<AuthTokens>>(
        `${environment.apiBaseUrl}/auth/login`,
        { phone, password, accountType },
        { context: new HttpContext().set(SKIP_AUTH, true) },
      )
      .pipe(
        map((response) => response.data),
        switchMap((tokens) => {
          this.tokens.save(tokens);
          return this.loadMe();
        }),
        catchError((error: unknown) => {
          const message = toUserMessage(error);
          this.errorState.set(message);
          return throwError(() => error);
        }),
        finalize(() => this.loadingState.set(false)),
      );
  }

  loadMe(): Observable<AuthMe> {
    return this.http.get<ApiEnvelope<AuthMe>>(`${environment.apiBaseUrl}/me`).pipe(
      map((response) => response.data),
      map((me) => {
        this.meState.set(me);
        this.errorState.set(null);
        return me;
      }),
    );
  }

  restoreSession(): Observable<AuthMe | null> {
    if (!this.tokens.hasRefreshToken()) return of(null);
    this.loadingState.set(true);
    return this.refresh().pipe(
      switchMap((refreshed) => (refreshed ? this.loadMe() : of(null))),
      catchError(() => of(null)),
      finalize(() => this.loadingState.set(false)),
    );
  }

  refresh(): Observable<boolean> {
    if (this.refreshRequest$) return this.refreshRequest$;
    const refreshToken = this.tokens.readRefreshToken();
    if (!refreshToken) return of(false);

    this.refreshRequest$ = this.http
      .post<ApiEnvelope<AuthTokens>>(
        `${environment.apiBaseUrl}/auth/refresh`,
        { refreshToken },
        { context: new HttpContext().set(SKIP_AUTH, true).set(NO_REFRESH, true) },
      )
      .pipe(
        map((response) => {
          this.tokens.save(response.data);
          return true;
        }),
        catchError(() => {
          this.tokens.clear();
          this.meState.set(null);
          return of(false);
        }),
        finalize(() => (this.refreshRequest$ = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.refreshRequest$;
  }

  logout(): Observable<void> {
    const refreshToken = this.tokens.readRefreshToken();
    const request$ = refreshToken
      ? this.http.post<void>(
          `${environment.apiBaseUrl}/auth/logout`,
          { refreshToken },
          {
            context: new HttpContext().set(NO_REFRESH, true),
            observe: 'body',
          },
        )
      : of(undefined);
    return request$.pipe(
      catchError(() => of(undefined)),
      finalize(() => this.clearSession()),
    );
  }

  clearSession(): void {
    this.tokens.clear();
    this.meState.set(null);
    this.errorState.set(null);
  }
}

function toUserMessage(error: unknown): string {
  if (error instanceof AuthApiError) {
    if (error.code === 'LOGIN_LOCKED')
      return 'تم إيقاف تسجيل الدخول مؤقتًا بعد محاولات فاشلة. حاول لاحقًا.';
    if (error.status === 401) return 'رقم الهاتف أو كلمة المرور غير صحيحة.';
    if (error.status === 429) return 'طلبات تسجيل الدخول كثيرة. حاول مرة أخرى بعد قليل.';
    return error.message;
  }
  return 'تعذر الاتصال بالـBackend. حاول مرة أخرى.';
}

export function toAuthApiError(status: number, payload: ApiProblem | null): AuthApiError {
  const message =
    payload?.detail ?? payload?.error?.message ?? payload?.title ?? 'حدث خطأ في المصادقة.';
  const code = payload?.extensions?.code ?? payload?.error?.code;
  return new AuthApiError(message, status, code);
}
