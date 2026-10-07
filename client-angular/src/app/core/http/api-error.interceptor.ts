import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { toAuthApiError } from '../auth/auth.service';
import type { ApiProblem } from '../auth/auth.models';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
      const payload = isApiProblem(error.error) ? error.error : null;
      return throwError(() => toAuthApiError(error.status, payload));
    }),
  );

function isApiProblem(value: unknown): value is ApiProblem {
  return typeof value === 'object' && value !== null;
}
