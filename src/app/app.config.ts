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

// Personnalisation du thème Aura avec couleurs indigo/purple
const PlansitterTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}'
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
    // Dependency Injection for repositories
    { provide: USER_REPOSITORY, useClass: UserSupabaseRepository },
    { provide: CLIENT_REPOSITORY, useClass: ClientSupabaseRepository },
    { provide: SERVICE_REPOSITORY, useClass: ServiceSupabaseRepository },
    { provide: SUBJECT_REPOSITORY, useClass: SubjectSupabaseRepository },
    { provide: BOOKING_REPOSITORY, useClass: BookingSupabaseRepository }
  ]
};
