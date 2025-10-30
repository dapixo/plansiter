import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService, LanguageService } from '@application/services';
import { map } from 'rxjs/operators';

/**
 * Guard pour les routes protégées (dashboard, etc.)
 * Attend que la session soit chargée, puis vérifie uniquement l'authentification.
 * La vérification de l'onboarding est gérée par l'onboardingGuard sur la route /onboarding.
 *
 * - Redirige vers /:lang/login si l'utilisateur n'est pas authentifié
 * - Permet l'accès si l'utilisateur est authentifié
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const languageService = inject(LanguageService);

  return authService.waitForSessionLoad().pipe(
    map(() => {
      // Check authentication only
      if (!authService.isAuthenticated()) {
        router.navigate([languageService.getCurrentLanguage(), 'login']);
        return false;
      }

      // Authenticated → allow access
      return true;
    })
  );
};
