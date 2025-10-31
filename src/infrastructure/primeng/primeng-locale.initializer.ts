import { inject, effect } from '@angular/core';
import { PrimeNG } from 'primeng/config';
import { LanguageService } from '@application/services';
import frLocale from 'primelocale/fr.json';
import enLocale from 'primelocale/en.json';
import esLocale from 'primelocale/es.json';
import itLocale from 'primelocale/it.json';

// Extraire les traductions depuis les fichiers JSON imbriqués
const LOCALE_MAP = {
  fr: frLocale.fr,
  en: enLocale.en,
  es: esLocale.es,
  it: itLocale.it
};

/**
 * Initializer pour configurer la locale PrimeNG en fonction de la langue active
 */
export function initializePrimeNGLocale() {
  return () => {
    const primeConfig = inject(PrimeNG);
    const languageService = inject(LanguageService);

    // Utiliser un effect pour réagir aux changements de langue
    effect(() => {
      const lang = languageService.currentLang();
      primeConfig.setTranslation(LOCALE_MAP[lang]);
    });
  };
}
