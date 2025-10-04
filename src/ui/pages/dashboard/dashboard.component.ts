import { Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '@application/services';
import { LanguageSwitcherComponent } from '@ui/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, TranslocoModule, LanguageSwitcherComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly currentUser = this.authService.currentUser;

  getUserDisplayName(): string {
    const email = this.currentUser()?.email;
    if (!email) return 'User';
    const parts = email.split('@');
    return parts[0] ?? 'User';
  }

  signOut(): void {
    this.authService.signOut().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}
