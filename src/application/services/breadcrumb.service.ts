import { Injectable, inject, computed, Signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { MenuItem } from 'primeng/api';
import { LanguageService } from './language.service';

export interface BreadcrumbConfig {
  parentLabel?: string;
  parentRoute?: string;
  currentLabel: string;
  currentRoute?: string;
}

type LabelResolver = string | (() => string | null | undefined);

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private readonly transloco = inject(TranslocoService);
  private readonly lang = inject(LanguageService);

  /**
   * Crée les items du breadcrumb de manière réactive
   * @param config Configuration du breadcrumb
   * @returns Signal des items du breadcrumb
   */
  createBreadcrumbItems(config: BreadcrumbConfig): Signal<MenuItem[]> {
    return this.buildBreadcrumb(config, () => this.transloco.translate(config.currentLabel));
  }

  /**
   * Crée les items du breadcrumb avec un label dynamique
   * @param config Configuration du breadcrumb
   * @param dynamicLabel Signal ou fonction retournant le label dynamique
   * @param fallbackLabelKey Clé de traduction de fallback si le label dynamique est null
   * @returns Signal des items du breadcrumb
   */
  createBreadcrumbItemsWithDynamicLabel(
    config: Omit<BreadcrumbConfig, 'currentLabel'>,
    dynamicLabel: Signal<string | null | undefined> | (() => string | null | undefined),
    fallbackLabelKey?: string
  ): Signal<MenuItem[]> {
    return this.buildBreadcrumb(config, () => {
      const label = typeof dynamicLabel === 'function' ? dynamicLabel() : dynamicLabel();
      return label || (fallbackLabelKey ? this.transloco.translate(fallbackLabelKey) : '...');
    });
  }

  /**
   * Crée l'item home du breadcrumb
   * @returns Item home du breadcrumb
   */
  createBreadcrumbHome(): MenuItem {
    return {
      icon: 'pi pi-home',
      routerLink: `/${this.lang.getCurrentLanguage()}/dashboard`
    };
  }

  /**
   * Méthode privée pour construire les items du breadcrumb
   * @param config Configuration du breadcrumb
   * @param currentLabelResolver Fonction qui résout le label de l'item courant
   * @returns Signal des items du breadcrumb
   */
  private buildBreadcrumb(
    config: Partial<BreadcrumbConfig>,
    currentLabelResolver: () => string
  ): Signal<MenuItem[]> {
    return computed<MenuItem[]>(() => {
      // Force reactivity to active language
      this.transloco.getActiveLang();
      const currentLang = this.lang.getCurrentLanguage();
      const items: MenuItem[] = [];

      // Ajouter le parent s'il existe
      if (config.parentLabel) {
        items.push({
          label: this.transloco.translate(config.parentLabel),
          routerLink: config.parentRoute ? `/${currentLang}${config.parentRoute}` : undefined
        });
      }

      // Ajouter l'item courant
      items.push({
        label: currentLabelResolver(),
        routerLink: config.currentRoute ? `/${currentLang}${config.currentRoute}` : undefined
      });

      return items;
    });
  }
}
