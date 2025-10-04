import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { filter, map } from 'rxjs/operators';

export const AVAILABLE_LANGS = ['fr', 'en', 'es', 'it'] as const;
export type AvailableLang = typeof AVAILABLE_LANGS[number];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private router = inject(Router);
  private transloco = inject(TranslocoService);

  // Signal qui track la langue actuelle
  currentLang = signal<AvailableLang>(this.getCurrentLanguage());

  constructor() {
    // Écouter les changements de navigation pour mettre à jour le signal
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.getCurrentLanguage())
    ).subscribe(lang => this.currentLang.set(lang));
  }

  /**
   * Obtient la langue actuelle (depuis URL ou préférée)
   */
  getCurrentLanguage(): AvailableLang {
    const urlLang = this.extractLangFromUrl(this.router.url);
    if (urlLang && this.isValidLang(urlLang)) {
      return urlLang;
    }
    return this.getPreferredLanguage();
  }


  /**
   * Extrait la langue depuis une URL
   * Ex: "/fr/dashboard" => "fr"
   */
  extractLangFromUrl(url: string): string | null {
    const segments = url.split('/').filter(s => s.length > 0);
    return segments[0] || null;
  }

  /**
   * Vérifie si une langue est valide
   */
  isValidLang(lang: string): lang is AvailableLang {
    return AVAILABLE_LANGS.includes(lang as AvailableLang);
  }

  /**
   * Obtient la langue préférée de l'utilisateur
   * Ordre: localStorage > navigateur > défaut (fr)
   */
  getPreferredLanguage(): AvailableLang {
    // 1. Vérifier localStorage
    const saved = localStorage.getItem('selectedLanguage');
    if (saved && this.isValidLang(saved)) {
      return saved;
    }

    // 2. Vérifier langue du navigateur
    const browserLang = navigator.language.split('-')[0];
    if (browserLang && this.isValidLang(browserLang)) {
      return browserLang;
    }

    // 3. Langue par défaut
    return 'fr';
  }

  /**
   * Change la langue et navigue vers la nouvelle URL
   */
  changeLanguage(newLang: AvailableLang): void {
    const currentUrl = this.router.url;
    const currentLang = this.extractLangFromUrl(currentUrl);

    let newUrl: string;
    if (currentLang && this.isValidLang(currentLang)) {
      // Remplacer la langue dans l'URL
      newUrl = currentUrl.replace(`/${currentLang}`, `/${newLang}`);
    } else {
      // Ajouter la langue au début
      newUrl = `/${newLang}${currentUrl}`;
    }

    // Charger et activer la nouvelle langue avant de naviguer
    this.transloco.load(newLang).subscribe(() => {
      this.transloco.setActiveLang(newLang);
      localStorage.setItem('selectedLanguage', newLang);
      this.currentLang.set(newLang);
      this.router.navigateByUrl(newUrl);
    });
  }

}
