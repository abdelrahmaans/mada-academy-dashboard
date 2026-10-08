import { HttpContextToken, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);
export const NO_REFRESH = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const skipAuth = request.context.get(SKIP_AUTH);
  const accessToken = auth.accessToken();
  const authorizedRequest =
    skipAuth || !accessToken
      ? request
      : request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (
        skipAuth ||
        request.context.get(NO_REFRESH) ||
        request.url.endsWith('/auth/refresh') ||
        !isUnauthorized(error)
      ) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap((refreshed) => {
          if (!refreshed || !auth.accessToken()) {
            return throwError(() => error);
          }
          return next(
            request.clone({
              setHeaders: { Authorization: `Bearer ${auth.accessToken()}` },
            }),
          );
        }),
        catchError((refreshError: unknown) => {
          auth.clearSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function isUnauthorized(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 401;
}
