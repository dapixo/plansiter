import { Component, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '@application/services';
import { LanguageSwitcherComponent } from '@ui/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AvatarModule,
    ButtonModule,
    TooltipModule,
    TranslocoModule,
    LanguageSwitcherComponent
  ],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent {
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly currentUser = this.authService.currentUser;
  readonly userDisplayName = this.authService.userDisplayName;
  readonly isCollapsed = signal(false);

  protected readonly menuItems = [
    { label: 'sidebar.planning', icon: 'pi pi-calendar', route: 'planning' },
    { label: 'sidebar.clients', icon: 'pi pi-users', route: 'clients' },
    { label: 'sidebar.services', icon: 'pi pi-briefcase', route: 'services' }
  ];

  protected signOut(): void {
    this.authService.signOut().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }


  protected toggleSidebar(): void {
    this.isCollapsed.update(value => !value);
  }
}
