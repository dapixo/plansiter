import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '@application/services';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <p-progressSpinner />
      <p class="mt-4 text-gray-600">Connexion en cours...</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      // Supabase gère automatiquement le token depuis l'URL
      const isAuthenticated = await this.authService.checkSession();

      if (isAuthenticated) {
        // Rediriger vers le dashboard ou la page d'accueil
        this.router.navigate(['/dashboard']);
      } else {
        // Si l'authentification échoue, rediriger vers la page de connexion
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      this.router.navigate(['/login']);
    }
  }
}
