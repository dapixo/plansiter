import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeEs from '@angular/common/locales/es';
import localeIt from '@angular/common/locales/it';

import { routes } from './app.routes';
import { translocoConfig } from '@infrastructure/i18n/transloco.config';

// Register locales
registerLocaleData(localeFr);
registerLocaleData(localeEs);
registerLocaleData(localeIt);

// Supabase repositories
import {
  USER_REPOSITORY,
  CLIENT_REPOSITORY,
  SERVICE_REPOSITORY,
  SUBJECT_REPOSITORY,
  BOOKING_REPOSITORY
} from '@domain/repositories';
import {
  UserSupabaseRepository,
  ClientSupabaseRepository,
  ServiceSupabaseRepository,
  SubjectSupabaseRepository,
  BookingSupabaseRepository
} from '@infrastructure/supabase/repositories';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    translocoConfig,
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-mode'
        }
      }
    }),
    // Dependency Injection for repositories
    { provide: USER_REPOSITORY, useClass: UserSupabaseRepository },
    { provide: CLIENT_REPOSITORY, useClass: ClientSupabaseRepository },
    { provide: SERVICE_REPOSITORY, useClass: ServiceSupabaseRepository },
    { provide: SUBJECT_REPOSITORY, useClass: SubjectSupabaseRepository },
    { provide: BOOKING_REPOSITORY, useClass: BookingSupabaseRepository }
  ]
};
