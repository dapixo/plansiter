import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService, LanguageService } from '@application/services';
import { map } from 'rxjs/operators';

/**
 * Guard pour les routes protégées (dashboard, etc.)
 * Attend que la session soit chargée, puis redirige vers /:lang/login si l'utilisateur n'est pas authentifié
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const languageService = inject(LanguageService);

  return authService.waitForSessionLoad().pipe(
    map(() => {
      if (authService.isAuthenticated()) {
        return true;
      }
      router.navigate([languageService.getCurrentLanguage(), 'login']);
      return false;
    })
  );
};
