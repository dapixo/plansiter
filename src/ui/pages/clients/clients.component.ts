import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Client, SubjectType } from '@domain/entities';
import { ClientStore } from '@application/stores/client.store';
import { EmptyStateComponent } from '@ui/components/empty-state/empty-state.component';
import { ActionButtonComponent } from '@ui/components/action-button/action-button.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    ConfirmDialogModule,
    TranslocoModule,
    EmptyStateComponent,
    ActionButtonComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent {
  readonly store = inject(ClientStore);
  private readonly transloco = inject(TranslocoService);
  private readonly confirmationService = inject(ConfirmationService);

  private readonly SUBJECT_ICONS: Record<SubjectType, string> = {
    'pet': 'pi-heart',
    'plant': 'pi-sun',
    'child': 'pi-user',
    'house': 'pi-home',
    'other': 'pi-circle'
  };

  protected readonly subjectsByClient = computed(() => {
    const subjects = this.store.activeSubjects();
    return subjects.reduce((acc, subject) => {
      if (!acc[subject.clientId]) {
        acc[subject.clientId] = [];
      }
      acc[subject.clientId].push(subject);
      return acc;
    }, {} as Record<string, typeof subjects>);
  });

  protected deleteClient(event: Event, client: Client): void {
    event.preventDefault();
    event.stopPropagation();

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

  protected getClientSubjects(clientId: string) {
    return this.subjectsByClient()[clientId] || [];
  }

  protected getSubjectIcon(type: SubjectType): string {
    return this.SUBJECT_ICONS[type] || this.SUBJECT_ICONS['other'];
  }
}
