import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Client } from '@domain/entities';
import { ClientFormComponent } from '@ui/components/client-form/client-form.component';
import { ClientStore } from '@application/stores/client.store';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ConfirmDialogModule,
    TranslocoModule
  ],
  providers: [ClientStore, DialogService, ConfirmationService],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent {
  readonly store = inject(ClientStore);
  private transloco = inject(TranslocoService);
  private dialogService = inject(DialogService);
  private confirmationService = inject(ConfirmationService);

  protected openCreateDialog(): void {
    this.dialogService.open(ClientFormComponent, {
      header: this.transloco.translate('clients.createClient'),
      width: '600px',
      focusOnShow: true,
      data: { client: null }
    });
  }

  protected openEditDialog(client: Client): void {
    this.dialogService.open(ClientFormComponent, {
      header: this.transloco.translate('clients.editClient'),
      width: '600px',
      focusOnShow: true,
      data: { client }
    });
  }

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
