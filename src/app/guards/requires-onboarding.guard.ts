import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserPreferencesStore } from '@application/stores/user-preferences.store';
import { LanguageService } from '@application/services/language.service';
import { map, filter, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Guard pour les routes qui nécessitent que l'utilisateur soit onboardé.
 * À utiliser APRÈS authGuard (suppose que l'utilisateur est déjà authentifié).
 *
 * - Redirige vers /:lang/onboarding si l'utilisateur n'est pas onboardé
 * - Permet l'accès si l'utilisateur est onboardé
 */
export const requiresOnboardingGuard: CanActivateFn = () => {
  const preferencesStore = inject(UserPreferencesStore);
  const router = inject(Router);
  const lang = inject(LanguageService);

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

      if (!isOnboarded) {
        // Not onboarded → redirect to onboarding
        const currentLang = lang.getCurrentLanguage();
        return router.createUrlTree([`/${currentLang}/onboarding`]);
      }

      // Onboarded → allow access
      return true;
    })
  );
};
