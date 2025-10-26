import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Service } from '@domain/entities';
import { ServiceStore } from '@application/stores/service.store';
import { EmptyStateComponent } from '@ui/components/empty-state/empty-state.component';
import { ActionButtonComponent } from '@ui/components/action-button/action-button.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmDialogModule,
    TranslocoModule,
    EmptyStateComponent,
    ActionButtonComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesComponent {
  readonly store = inject(ServiceStore);
  private transloco = inject(TranslocoService);
  private confirmationService = inject(ConfirmationService);

  protected deleteService(event: Event, service: Service): void {
    // Empêcher la navigation vers la page d'édition
    event.preventDefault();
    event.stopPropagation();

    this.confirmationService.confirm({
      message: this.transloco.translate('services.deleteConfirm', { name: service.name }),
      header: this.transloco.translate('services.deleteTitle'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.transloco.translate('services.deleteAccept'),
      rejectLabel: this.transloco.translate('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.store.delete(service.id);
      }
    });
  }
}
