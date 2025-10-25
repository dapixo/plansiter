import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { languageGuard } from './guards/language.guard';
import { redirectToPreferredLangGuard } from './guards/redirect-to-preferred-lang.guard';

export interface BreadcrumbData {
  label: string | string[]; // Clé de traduction pour le label (string pour statique, string[] pour [create, edit])
  parent?: {
    label: string; // Clé de traduction pour le label parent
    path: string; // Chemin complet de la route parent (ex: '/fr/dashboard/clients')
  };
}

export const routes: Routes = [
  // Route racine - redirection vers langue préférée
  {
    path: '',
    pathMatch: 'full',
    canActivate: [redirectToPreferredLangGuard],
    children: []
  },
  // Routes avec préfixe de langue
  {
    path: ':lang',
    canActivate: [languageGuard],
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('../ui/pages/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
          import('../ui/layouts/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../ui/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
          },
          {
            path: 'planning',
            loadComponent: () =>
              import('../ui/pages/planning/planning.component').then(m => m.PlanningComponent),
            data: { breadcrumb: { label: 'sidebar.planning' } as BreadcrumbData }
          },
          {
            path: 'clients',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('../ui/pages/clients/clients.component').then(m => m.ClientsComponent),
                data: { breadcrumb: { label: 'clients.title' } as BreadcrumbData }
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('../ui/pages/client-form-page/client-form-page.component').then(m => m.ClientFormPageComponent),
                data: {
                  breadcrumb: {
                    label: 'clients.createClient',
                    parent: { label: 'clients.title', path: '/dashboard/clients' }
                  } as BreadcrumbData
                }
              },
              {
                path: ':id',
                loadComponent: () =>
                  import('../ui/pages/client-detail-page/client-detail-page.component').then(m => m.ClientDetailPageComponent),
                data: {
                  breadcrumb: {
                    label: 'clients.detailClient',
                    parent: { label: 'clients.title', path: '/dashboard/clients' }
                  } as BreadcrumbData
                }
              }
            ]
          },
          {
            path: 'services',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('../ui/pages/services/services.component').then(m => m.ServicesComponent),
                data: { breadcrumb: { label: 'services.title' } as BreadcrumbData }
              },
              {
                path: 'new',
                loadComponent: () =>
                  import('../ui/pages/service-form-page/service-form-page.component').then(m => m.ServiceFormPageComponent),
                data: {
                  breadcrumb: {
                    label: 'services.createService',
                    parent: { label: 'services.title', path: '/dashboard/services' }
                  } as BreadcrumbData
                }
              },
              {
                path: ':id/edit',
                loadComponent: () =>
                  import('../ui/pages/service-form-page/service-form-page.component').then(m => m.ServiceFormPageComponent),
                data: {
                  breadcrumb: {
                    label: 'services.editService',
                    parent: { label: 'services.title', path: '/dashboard/services' }
                  } as BreadcrumbData
                }
              }
            ]
          },
          {
            path: 'account',
            loadComponent: () =>
              import('../ui/pages/account/account.component').then(m => m.AccountComponent),
            data: { breadcrumb: { label: 'account.title' } as BreadcrumbData }
          }
        ]
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  // Wildcard - redirection vers langue préférée
  {
    path: '**',
    canActivate: [redirectToPreferredLangGuard],
    children: []
  }
];
