import { Component, inject, DestroyRef, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService, BreadcrumbService } from '@application/services';
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
    BreadcrumbModule,
    TranslocoModule,
    LanguageSwitcherComponent
  ],
  templateUrl: './dashboard-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardLayoutComponent {
  private authService = inject(AuthService);
  protected readonly breadcrumbService = inject(BreadcrumbService);
  private destroyRef = inject(DestroyRef);

  protected readonly isCollapsed = signal(false);
  protected readonly userDisplayName = this.authService.userDisplayName;
  protected readonly breadcrumbItems = this.breadcrumbService.breadcrumbItems;
  protected readonly breadcrumbHome = this.breadcrumbService.breadcrumbHome;

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
