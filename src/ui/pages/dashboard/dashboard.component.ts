import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '@application/services';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, TranslocoModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  private authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly userDisplayName = this.authService.userDisplayName;
}
