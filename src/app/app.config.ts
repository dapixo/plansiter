import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeEs from '@angular/common/locales/es';
import localeIt from '@angular/common/locales/it';

import { routes } from './app.routes';
import { translocoConfig } from '@infrastructure/i18n/transloco.config';
import { initializePrimeNGLocale } from '@infrastructure/primeng/primeng-locale.initializer';

// Personnalisation du thème Aura avec la palette PlanSitter (Rose/Terracotta)
const PlansitterTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#F5E9FF',
      100: '#E9D5FF',
      200: '#D8B4FE',
      300: '#C084FC',
      400: '#A855F7',
      500: '#9333EA',
      600: '#7E22CE',
      700: '#6B21A8',
      800: '#581C87',
      900: '#3B0764',
      950: '#210033'
    },
    colorScheme: {
      light: {
      }
    }
  }
});

// Register locales
registerLocaleData(localeFr);
registerLocaleData(localeEs);
registerLocaleData(localeIt);

// Stores
import { ClientStore } from '@application/stores/client.store';
import { ServiceStore } from '@application/stores/service.store';
import { UserPreferencesStore } from '@application/stores/user-preferences.store';

// Supabase repositories
import {
  CLIENT_REPOSITORY,
  SERVICE_REPOSITORY,
  SUBJECT_REPOSITORY,
  BOOKING_REPOSITORY,
  USER_PREFERENCES_REPOSITORY
} from '@domain/repositories';
import {
  ClientSupabaseRepository,
  ServiceSupabaseRepository,
  SubjectSupabaseRepository,
  BookingSupabaseRepository,
  UserPreferencesSupabaseRepository
} from '@infrastructure/supabase/repositories';
import { BookingStore } from '@application/stores/booking.store';

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
        preset: PlansitterTheme,
        options: {
          darkModeSelector: '.dark-mode',
        }
      }
    }),
    // Initialize PrimeNG locale based on current language
    {
      provide: APP_INITIALIZER,
      useFactory: initializePrimeNGLocale,
      multi: true
    },
    // Global Stores
    ClientStore,
    ServiceStore,
    BookingStore,
    UserPreferencesStore,
    // Dependency Injection for repositories
    { provide: CLIENT_REPOSITORY, useClass: ClientSupabaseRepository },
    { provide: SERVICE_REPOSITORY, useClass: ServiceSupabaseRepository },
    { provide: SUBJECT_REPOSITORY, useClass: SubjectSupabaseRepository },
    { provide: BOOKING_REPOSITORY, useClass: BookingSupabaseRepository },
    { provide: USER_PREFERENCES_REPOSITORY, useClass: UserPreferencesSupabaseRepository }
  ]
};
