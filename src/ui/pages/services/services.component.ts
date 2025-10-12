import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Service, ServiceType } from '@domain/entities';
import { ServiceStore } from '@application/stores/service.store';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmDialogModule,
    TranslocoModule
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

  private readonly SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
    'pet-sitting': 'services.types.petSitting',
    'plant-sitting': 'services.types.plantSitting',
    'babysitting': 'services.types.babysitting',
    'house-sitting': 'services.types.houseSitting',
    'other': 'services.types.other'
  };

  protected deleteService(service: Service): void {
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

  protected getServiceTypeLabel(type: ServiceType): string {
    return this.SERVICE_TYPE_LABELS[type] || type;
  }

  protected getPriceDisplay(service: Service): string {
    if (service.pricePerHour) {
      return this.transloco.translate('services.pricePerHour', { price: service.pricePerHour });
    }
    if (service.pricePerDay) {
      return this.transloco.translate('services.pricePerDay', { price: service.pricePerDay });
    }
    if (service.pricePerNight) {
      return this.transloco.translate('services.pricePerNight', { price: service.pricePerNight });
    }
    return this.transloco.translate('services.priceNotSet');
  }
}
