import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService, LanguageService } from '@application/services';
import { map } from 'rxjs/operators';

/**
 * Unified guard for authentication and onboarding checks.
 * Replaces the previous authGuard, requiresOnboardingGuard, and onboardingGuard.
 *
 * Route data configuration:
 * - No data: Only checks authentication (for routes like /onboarding)
 * - requiresOnboarding: true → Checks authentication AND onboarding (for /dashboard, etc.)
 * - preventIfOnboarded: true → Prevents access if already onboarded (for /onboarding page itself)
 *
 * @example
 * // Just authentication check
 * { path: 'onboarding', canActivate: [authWithOnboardingGuard] }
 *
 * // Authentication + requires onboarding complete
 * { path: 'dashboard', canActivate: [authWithOnboardingGuard], data: { requiresOnboarding: true } }
 *
 * // Authentication + must NOT be onboarded (onboarding page)
 * { path: 'onboarding', canActivate: [authWithOnboardingGuard], data: { preventIfOnboarded: true } }
 */
export const authWithOnboardingGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const languageService = inject(LanguageService);

  return authService.waitForSessionLoad().pipe(
    map(() => {
      const currentLang = languageService.getCurrentLanguage();
      const isAuthenticated = authService.isAuthenticated();
      const isOnboarded = authService.isOnboarded();

      // Route data flags
      const requiresOnboarding = route.data?.['requiresOnboarding'] === true;
      const preventIfOnboarded = route.data?.['preventIfOnboarded'] === true;

      // Check 1: Not authenticated → redirect to login
      if (!isAuthenticated) {
        return router.createUrlTree([currentLang, 'login']);
      }

      // Check 2: Route requires onboarding but user is not onboarded → redirect to onboarding
      if (requiresOnboarding && !isOnboarded) {
        return router.createUrlTree([currentLang, 'onboarding']);
      }

      // Check 3: Route prevents access if already onboarded (onboarding page) → redirect to dashboard
      if (preventIfOnboarded && isOnboarded) {
        return router.createUrlTree([currentLang, 'dashboard']);
      }

      // All checks passed → allow access
      return true;
    })
  );
};
