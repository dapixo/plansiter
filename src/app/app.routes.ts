import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { languageGuard } from './guards/language.guard';
import { redirectToPreferredLangGuard } from './guards/redirect-to-preferred-lang.guard';

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
          import('../ui/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
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
