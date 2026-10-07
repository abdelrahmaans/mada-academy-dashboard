import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthorizationService } from './authorization.service';
import type { AuthorizationPolicy } from './authorization.models';

export const authorizationGuard: CanActivateFn = (_route) => {
  const auth = inject(AuthService);
  const authorization = inject(AuthorizationService);
  const router = inject(Router);
  const policy = (_route.data['authorization'] ?? {}) as AuthorizationPolicy;
  const check = () =>
    authorization.can(policy)
      ? true
      : router.createUrlTree(['/workspace'], { queryParams: { reason: 'forbidden' } });

  if (auth.initialized()) return check();
  return auth.restoreSession().pipe(map(check));
};
