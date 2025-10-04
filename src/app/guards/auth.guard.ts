import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '@application/services/auth.service';
import { map } from 'rxjs/operators';

/**
 * Guard pour les routes protégées (dashboard, etc.)
 * Attend que la session soit chargée, puis redirige vers /login si l'utilisateur n'est pas authentifié
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForSessionLoad().pipe(
    map(() => {
      if (authService.isAuthenticated()) {
        return true;
      }
      router.navigate(['/login']);
      return false;
    })
  );
};
