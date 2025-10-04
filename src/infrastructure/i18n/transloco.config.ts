import { provideTransloco, TranslocoModule } from '@jsverse/transloco';
import { isDevMode } from '@angular/core';
import { TranslocoHttpLoader } from './transloco-loader';

export const translocoConfig = provideTransloco({
  config: {
    availableLangs: [
      { id: 'fr', label: 'Français' },
      { id: 'en', label: 'English' },
      { id: 'es', label: 'Español' },
      { id: 'it', label: 'Italiano' }
    ],
    defaultLang: 'fr',
    reRenderOnLangChange: true,
    prodMode: !isDevMode(),
    fallbackLang: 'fr',
    missingHandler: {
      useFallbackTranslation: true
    }
  },
  loader: TranslocoHttpLoader
});

export { TranslocoModule };
