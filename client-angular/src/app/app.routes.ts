import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { FoundationPage } from './pages/foundation/foundation-page';

export const routes: Routes = [
  { path: '', redirectTo: 'workspace', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login-page').then((module) => module.LoginPage),
  },
  {
    path: 'workspace',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/workspace/workspace-page').then((module) => module.WorkspacePage),
  },
  { path: 'foundation', component: FoundationPage, pathMatch: 'full' },
  {
    path: 'shared-components',
    loadComponent: () =>
      import('./shared/pages/shared-components-preview/shared-components-preview').then(
        (module) => module.SharedComponentsPreview,
      ),
  },
  { path: '**', redirectTo: '' },
];
