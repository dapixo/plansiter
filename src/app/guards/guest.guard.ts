import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService, LanguageService } from '@application/services';
import { map } from 'rxjs/operators';

/**
 * Guard pour les routes publiques (login, register, etc.)
 * Attend que la session soit chargée, puis redirige vers /:lang/dashboard si l'utilisateur est déjà authentifié
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const languageService = inject(LanguageService);

  return authService.waitForSessionLoad().pipe(
    map(() => {
      if (authService.isAuthenticated()) {
        router.navigate([languageService.getCurrentLanguage(), 'dashboard']);
        return false;
      }
      return true;
    })
  );
};
