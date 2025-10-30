import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@application/services/auth.service';
import { UserPreferencesStore } from '@application/stores/user-preferences.store';
import { LanguageService } from '@application/services/language.service';
import { map, filter, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Guard to protect the onboarding route.
 * Only allows access if user is authenticated and NOT onboarded yet.
 * Redirects to dashboard if already onboarded.
 */
export const onboardingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const preferencesStore = inject(UserPreferencesStore);
  const router = inject(Router);
  const lang = inject(LanguageService);

  // Check if user is authenticated
  if (!auth.isAuthenticated()) {
    const currentLang = lang.getCurrentLanguage();
    return router.createUrlTree([`/${currentLang}/login`]);
  }

  // If not initialized yet, trigger loading
  if (!preferencesStore.initialized() && !preferencesStore.loading()) {
    preferencesStore.load();
  }

  // Wait for preferences store to be initialized, then check onboarding status
  return toObservable(preferencesStore.initialized).pipe(
    // Wait until preferences have been loaded (or attempted to load)
    filter(initialized => initialized),
    take(1),
    map(() => {
      const isOnboarded = preferencesStore.isOnboarded();

      if (isOnboarded) {
        // Already onboarded → redirect to dashboard
        const currentLang = lang.getCurrentLanguage();
        return router.createUrlTree([`/${currentLang}/dashboard`]);
      }

      // Not onboarded → allow access to onboarding
      return true;
    })
  );
};
