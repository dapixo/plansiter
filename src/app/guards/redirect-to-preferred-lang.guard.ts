import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LanguageService } from '@application/services';

/**
 * Guard qui redirige vers la langue préférée de l'utilisateur
 * Utilisé pour les routes racine et wildcard
 */
export const redirectToPreferredLangGuard: CanActivateFn = () => {
  const router = inject(Router);
  const languageService = inject(LanguageService);

  const preferredLang = languageService.getPreferredLanguage();
  router.navigate([preferredLang, 'dashboard']);

  return false;
};
