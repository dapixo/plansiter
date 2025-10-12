import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Client } from '@domain/entities';
import { ClientStore } from '@application/stores/client.store';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    ConfirmDialogModule,
    TranslocoModule
  ],
  providers: [ConfirmationService],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent {
  readonly store = inject(ClientStore);
  private transloco = inject(TranslocoService);
  private confirmationService = inject(ConfirmationService);

  protected deleteClient(client: Client): void {
    this.confirmationService.confirm({
      message: this.transloco.translate('clients.deleteConfirm', { name: client.name }),
      header: this.transloco.translate('clients.deleteTitle'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.transloco.translate('clients.deleteAccept'),
      rejectLabel: this.transloco.translate('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.store.delete(client.id);
      }
    });
  }
}
