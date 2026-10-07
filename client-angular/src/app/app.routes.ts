import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { authorizationGuard } from './core/auth/authorization.guard';
import { FoundationPage } from './pages/foundation/foundation-page';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard, authorizationGuard],
    data: {
      authorization: {
        roles: ['R02_BRANCH_MANAGER'],
        permissions: ['branch.read'],
      },
    },
    loadComponent: () =>
      import('./features/dashboard/pages/branch-dashboard-page').then(
        (module) => module.BranchDashboardPage,
      ),
  },
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
  {
    path: 'head-instructors',
    canActivate: [authGuard, authorizationGuard],
    data: {
      authorization: {
        roles: ['R03_HEAD_INSTRUCTORS'],
        permissions: ['sessions.read', 'evaluations.review'],
      },
    },
    loadComponent: () =>
      import('./features/head-instructors/pages/head-instructors-dashboard-page').then(
        (module) => module.HeadInstructorsDashboardPage,
      ),
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
