import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';

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
    provideAnimationsAsync(),
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
