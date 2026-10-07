import { HttpContextToken, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { AuthApiError } from '../auth/auth.models';
import { AuthorizationService } from '../auth/authorization.service';
import type { EndpointKey } from '../auth/authorization.models';

export const ENDPOINT_POLICY = new HttpContextToken<EndpointKey | null>(() => null);

/**
 * Advisory client policy. It is opt-in per request and never replaces backend authorization.
 * Features should set the context to the matrix key matching the endpoint group.
 */
export const endpointPolicyInterceptor: HttpInterceptorFn = (request, next) => {
  const endpoint = request.context.get(ENDPOINT_POLICY);
  if (endpoint && !inject(AuthorizationService).canEndpoint(endpoint)) {
    return throwError(
      () =>
        new AuthApiError(
          'Endpoint is not available for the current role.',
          403,
          'CLIENT_ENDPOINT_FORBIDDEN',
        ),
    );
  }
  return next(request);
};
