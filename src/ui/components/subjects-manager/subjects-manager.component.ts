import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Subject } from '@domain/entities';
import { ClientStore } from '@application/stores/client.store';
import { TempSubject } from '@application/services/client-management.service';
import { SubjectCardComponent } from '@ui/components/subject-card/subject-card.component';
import { SubjectFormDialogComponent } from '@ui/components/subject-form-dialog/subject-form-dialog.component';
import { ActionButtonComponent } from '../action-button/action-button.component';

@Component({
  selector: 'app-subjects-manager',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    ConfirmDialogModule,
    SubjectCardComponent,
    SubjectFormDialogComponent,
    ActionButtonComponent
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-4" aria-label="{{ 'subjects.managerTitle' | transloco }}">
      <!-- Liste des subjects -->
      @if (displayedSubjects().length > 0) {
        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-3"
          role="list"
          aria-label="{{ 'subjects.list' | transloco }}"
        >
          @for (
            subject of displayedSubjects();
            track subject.id || ('tempId' in subject ? subject.tempId : null);
            let i = $index
          ) {
            <app-subject-card
              role="listitem"
              [subject]="subject"
              (edit)="onEdit(i)"
              (delete)="onDelete(i)"
            />
          }
        </div>
      }

      <!-- Bouton ajouter -->
      <app-action-button
        [route]="null"
        type="button"
        (click)="onAdd()"
        labelKey="subjects.addSubject"
        icon="pi-plus"
        ariaLabelKey="subjects.addSubject"
      />

      <!-- Modale formulaire subject -->
      <app-subject-form-dialog
        [(subjectDialogVisible)]="dialogVisible"
        [clientId]="clientId() ?? undefined"
        [subject]="editingSubject()"
        (subjectSaved)="handleSubjectSaved($event)"
      />

      <!-- Modale confirmation suppression -->
      <p-confirmDialog />
    </section>
  `,
})
export class SubjectsManagerComponent {
  private readonly store = inject(ClientStore);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly transloco = inject(TranslocoService);

  // Inputs / Outputs
  readonly clientId = input<string | null>(null);
  readonly subjectsChange = output<TempSubject[]>(); // pour le mode création

  // Local UI state
  protected readonly dialogVisible = signal(false);
  protected readonly editingSubject = signal<Partial<Subject> | null>(null);
  protected readonly tempSubjects = signal<TempSubject[]>([]);

  // Mode de fonctionnement
  protected readonly isEditMode = computed(() => !!this.clientId());

  // Subjects affichés selon le mode
  protected readonly displayedSubjects = computed<Subject[] | TempSubject[]>(() => {
    return this.isEditMode()
      ? this.store.subjects().filter(s => s.clientId === this.clientId() && !s.deletedAt)
      : this.tempSubjects();
  });

  // === Actions UI ===

  protected onAdd(): void {
    this.editingSubject.set(null);
    this.dialogVisible.set(true);
  }

  protected onEdit(index: number): void {
    const subject = this.displayedSubjects()[index];
    this.editingSubject.set(subject);
    this.dialogVisible.set(true);
  }

  protected onDelete(index: number): void {
    const subject = this.displayedSubjects()[index];

    this.confirmationService.confirm({
      message: `${this.transloco.translate('subjects.deleteConfirmMessage')} (${subject.name})`,
      header: this.transloco.translate('subjects.deleteConfirmTitle'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.transloco.translate('common.delete'),
      rejectLabel: this.transloco.translate('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.isEditMode() && subject.id
          ? this.deletePersistedSubject(subject.id)
          : this.deleteTempSubject(index);
      }
    });
  }

  // === Dialog Handlers ===

  protected handleSubjectCreated(_subject: Subject): void {
    // En mode édition, le store met déjà à jour les données
    this.resetDialog();
  }

  protected handleSubjectSaved(payload: Omit<Subject, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>): void {
    this.isEditMode()
      ? this.updatePersistedSubject(payload)
      : this.updateTempSubject(payload);
    this.resetDialog();
  }

  // === Private methods ===

  private deletePersistedSubject(id: string): void {
    this.store.deleteSubject(id);
  }

  private deleteTempSubject(index: number): void {
    const updated = [...this.tempSubjects()];
    updated.splice(index, 1);
    this.tempSubjects.set(updated);
    this.subjectsChange.emit(updated);
  }

  private updateTempSubject(payload: Omit<Subject, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>): void {
    const updated = [...this.tempSubjects()];
    const editing = this.editingSubject();

    if (editing && 'tempId' in editing) {
      const idx = updated.findIndex(s => s.tempId === editing.tempId);
      if (idx !== -1) updated[idx] = { ...updated[idx], ...payload };
    } else {
      updated.push({ tempId: crypto.randomUUID(), ...payload });
    }

    this.tempSubjects.set(updated);
    this.subjectsChange.emit(updated);
  }

  private updatePersistedSubject(_payload: unknown): void {
    // À implémenter plus tard si édition persistée
  }

  private resetDialog(): void {
    this.dialogVisible.set(false);
    this.editingSubject.set(null);
  }
}
