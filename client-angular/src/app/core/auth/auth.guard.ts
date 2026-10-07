import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.initialized()) return auth.authenticated() ? true : router.createUrlTree(['/login']);
  return auth
    .restoreSession()
    .pipe(map(() => (auth.authenticated() ? true : router.createUrlTree(['/login']))));
};
