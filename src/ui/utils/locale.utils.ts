/**
 * Mapping des langues de l'application vers les codes locale standard
 */
export const LOCALE_MAP: Record<string, string> = {
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  en: 'en-GB',
};

/**
 * Récupère le code locale pour une langue donnée
 * @param lang - Code langue de l'application (fr, en, es, it)
 * @param fallback - Locale par défaut si non trouvée
 * @returns Le code locale standard (ex: 'fr-FR')
 */
export function getLocaleCode(lang: string, fallback = 'fr-FR'): string {
  return LOCALE_MAP[lang] || fallback;
}
