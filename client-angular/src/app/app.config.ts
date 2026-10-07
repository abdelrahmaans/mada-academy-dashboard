import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  LucideBarChart3,
  LucideBell,
  LucideBookOpen,
  LucideBuilding2,
  LucideCalendarDays,
  LucideChevronDown,
  LucideChevronLeft,
  LucideCircleCheck,
  LucideCircleHelp,
  LucideClock3,
  LucideGraduationCap,
  LucideLayoutDashboard,
  LucideArrowLeft,
  LucideActivity,
  LucideRefreshCw,
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
import { endpointPolicyInterceptor } from './core/http/endpoint-policy.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, endpointPolicyInterceptor, apiErrorInterceptor]),
    ),
    provideLucideIcons(
      LucideBarChart3,
      LucideBell,
      LucideBookOpen,
      LucideBuilding2,
      LucideCalendarDays,
      LucideChevronDown,
      LucideChevronLeft,
      LucideCircleCheck,
      LucideCircleHelp,
      LucideClock3,
      LucideGraduationCap,
      LucideLayoutDashboard,
      LucideArrowLeft,
      LucideActivity,
      LucideKeyRound,
      LucideLockKeyhole,
      LucidePhone,
      LucideRefreshCw,
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
