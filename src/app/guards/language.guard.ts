import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '@application/services/language.service';
import { map } from 'rxjs/operators';

/**
 * Guard qui valide et active la langue depuis l'URL
 * Redirige vers la langue préférée si la langue dans l'URL est invalide
 */
export const languageGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const languageService = inject(LanguageService);
  const transloco = inject(TranslocoService);
  const router = inject(Router);

  const lang = route.paramMap.get('lang');

  if (!lang || !languageService.isValidLang(lang)) {
    // Langue invalide -> rediriger vers langue préférée
    const preferredLang = languageService.getPreferredLanguage();
    const pathWithoutLang = route.url.map(segment => segment.path).join('/');
    router.navigate([preferredLang, pathWithoutLang]);
    return false;
  }

  // Langue valide -> charger et activer la langue AVANT de laisser passer
  if (transloco.getActiveLang() !== lang) {
    return transloco.load(lang).pipe(
      map(() => {
        transloco.setActiveLang(lang);
        localStorage.setItem('selectedLanguage', lang);
        languageService.currentLang.set(lang);
        return true;
      })
    );
  }

  // Langue déjà active
  languageService.currentLang.set(lang);
  return true;
};
