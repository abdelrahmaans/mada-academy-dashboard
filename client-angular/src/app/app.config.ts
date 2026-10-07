import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  LucideBarChart3,
  LucideBookOpen,
  LucideBuilding2,
  LucideCalendarDays,
  LucideChevronDown,
  LucideChevronLeft,
  LucideCircleCheck,
  LucideCircleHelp,
  LucideGraduationCap,
  LucideLayoutDashboard,
  LucideArrowLeft,
  LucideKeyRound,
  LucideLockKeyhole,
  LucidePhone,
  LucideLogOut,
  LucideMapPin,
  LucideMenu,
  LucideShieldCheck,
  LucideSettings,
  LucideUserPlus,
  LucideUsers,
  LucideWallet,
  LucideX,
  provideLucideIcons,
} from '@lucide/angular';

import { routes } from './app.routes';
import { apiErrorInterceptor } from './core/http/api-error.interceptor';
import { authInterceptor } from './core/http/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, apiErrorInterceptor])),
    provideLucideIcons(
      LucideBarChart3,
      LucideBookOpen,
      LucideBuilding2,
      LucideCalendarDays,
      LucideChevronDown,
      LucideChevronLeft,
      LucideCircleCheck,
      LucideCircleHelp,
      LucideGraduationCap,
      LucideLayoutDashboard,
      LucideArrowLeft,
      LucideKeyRound,
      LucideLockKeyhole,
      LucidePhone,
      LucideLogOut,
      LucideMapPin,
      LucideMenu,
      LucideShieldCheck,
      LucideSettings,
      LucideUserPlus,
      LucideUsers,
      LucideWallet,
      LucideX,
    ),
  ],
};
