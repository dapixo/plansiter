import { computed, inject, Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, startWith } from 'rxjs';
import { LanguageService } from './language.service';
import { BreadcrumbData } from 'app/app.routes';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly lang = inject(LanguageService);

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null)
    )
  );

  private readonly activeLang = toSignal(
    this.transloco.langChanges$.pipe(
      startWith(this.transloco.getActiveLang())
    )
  );

  readonly breadcrumbItems = computed<MenuItem[]>(() => {
    this.navigationEnd();
    this.activeLang();

    const route = this.getLeafRoute(this.activatedRoute);
    const breadcrumb = route.snapshot.data['breadcrumb'] as BreadcrumbData | undefined;
    if (!breadcrumb) return [];

    const lang = this.lang.getCurrentLanguage();

    const parentItems: MenuItem[] = breadcrumb.parent
      ? [{
          label: this.transloco.translate(breadcrumb.parent.label),
          routerLink: [`/${lang}${breadcrumb.parent.path}`]
        }]
      : [];

    const label = this.transloco.translate(breadcrumb.label as string);

    return [...parentItems, { label }];
  });

  private getLeafRoute(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) route = route.firstChild;
    return route;
  }

  readonly breadcrumbHome = computed(() => ({
    icon: 'pi pi-home',
    routerLink: `/${this.lang.getCurrentLanguage()}/dashboard`
  }));
}
