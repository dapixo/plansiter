import { fr, enUS, es, it } from 'date-fns/locale';

export const LOCALE_MAP = {
  fr: { code: 'fr' as const, locale: fr },
  es: { code: 'es' as const, locale: es },
  it: { code: 'it' as const, locale: it },
  en: { code: 'en' as const, locale: enUS }
} as const;

export type LocaleKey = keyof typeof LOCALE_MAP;
