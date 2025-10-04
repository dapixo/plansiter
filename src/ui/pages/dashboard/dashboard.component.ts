import { Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AuthService } from '@application/services';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly currentUser = this.authService.currentUser;

  signOut(): void {
    this.authService.signOut().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}
