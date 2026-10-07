import { Routes } from '@angular/router';
import { FoundationPage } from './pages/foundation/foundation-page';

export const routes: Routes = [
  { path: '', component: FoundationPage, pathMatch: 'full' },
  {
    path: 'shared-components',
    loadComponent: () =>
      import('./shared/pages/shared-components-preview/shared-components-preview').then(
        (module) => module.SharedComponentsPreview,
      ),
  },
  { path: '**', redirectTo: '' },
];
