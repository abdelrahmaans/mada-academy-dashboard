import { Routes } from '@angular/router';
import { FeaturePageComponent } from './feature-page.component';

export const routes: Routes = [
  { path: '', component: FeaturePageComponent, title: 'ملخص التشغيل' },
  { path: '**', component: FeaturePageComponent },
];
