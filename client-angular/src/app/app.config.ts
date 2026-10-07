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

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
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
