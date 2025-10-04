import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '@application/services/auth.service';
import { map } from 'rxjs/operators';

/**
 * Guard pour les routes publiques (login, register, etc.)
 * Attend que la session soit chargée, puis redirige vers /dashboard si l'utilisateur est déjà authentifié
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForSessionLoad().pipe(
    map(() => {
      if (authService.isAuthenticated()) {
        router.navigate(['/dashboard']);
        return false;
      }
      return true;
    })
  );
};
