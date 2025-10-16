import {
  Component,
  inject,
  input,
  output,
  signal,
  effect,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TranslocoModule } from '@jsverse/transloco';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ClientStore } from '@application/stores/client.store';
import { TempSubject } from '@application/services/client-management.service';
import { Subject, SubjectType } from '@domain/entities';

@Component({
  selector: 'app-client-subjects-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    MessageModule,
    TranslocoModule,
    SelectModule,
    InputNumberModule,
    TextareaModule,
  ],
  templateUrl: './client-subjects-form.component.html',
  styleUrls: ['./client-subjects-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientSubjectsFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(ClientStore);

  // Inputs
  readonly clientId = input<string | null>(null);
  readonly isEditMode = input<boolean>(false);

  // Outputs
  readonly subjectsChange = output<TempSubject[]>();

  // Subject types
  protected readonly subjectTypes: { label: string; value: SubjectType }[] = [
    { label: 'subjects.types.pet', value: 'pet' },
    { label: 'subjects.types.plant', value: 'plant' },
    { label: 'subjects.types.child', value: 'child' },
    { label: 'subjects.types.house', value: 'house' },
    { label: 'subjects.types.other', value: 'other' },
  ];

  // State
  protected readonly tempSubjects = signal<TempSubject[]>([]);
  protected readonly showSubjectForm = signal(false);
  protected readonly editingSubjectIndex = signal<number | null>(null);

  // Form
  protected readonly subjectForm: FormGroup<{
    type: FormControl<SubjectType | null>;
    name: FormControl<string>;
    breed: FormControl<string>;
    age: FormControl<number | null>;
    specialNeeds: FormControl<string>;
    notes: FormControl<string>;
  }> = this.fb.group({
    type: this.fb.control<SubjectType | null>(null, { validators: Validators.required }),
    name: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    breed: this.fb.control('', { nonNullable: true }),
    age: this.fb.control<number | null>(null),
    specialNeeds: this.fb.control('', { nonNullable: true }),
    notes: this.fb.control('', { nonNullable: true }),
  });

  // Effect pour synchroniser les subjects du store avec tempSubjects
  private readonly _syncEffect = effect(() => {
    const allSubjects = this.store.subjects();
    const clientId = untracked(() => this.clientId());
    const isEditMode = untracked(() => this.isEditMode());

    if (!isEditMode || !clientId) return;

    const existingSubjects = allSubjects
      .filter(s => s.clientId === clientId)
      .map(s => this.mapSubjectToTemp(s));

    this.updateSubjects(existingSubjects);
  });

  // ========== HELPER METHODS ==========

  /** Convertit un Subject en TempSubject */
  private mapSubjectToTemp(subject: Subject): TempSubject {
    return {
      tempId: subject.id,
      id: subject.id,
      type: subject.type,
      name: subject.name,
      breed: subject.breed,
      age: subject.age,
      specialNeeds: subject.specialNeeds,
      notes: subject.notes,
      isExisting: true,
    };
  }

  /** Extrait les données du formulaire pour créer un payload Subject */
  private getSubjectPayloadFromForm(): Omit<TempSubject, 'tempId' | 'id' | 'isExisting'> {
    const { type, name, breed, age, specialNeeds, notes } = this.subjectForm.value;
    return {
      type: type!,
      name: name!,
      breed: breed || undefined,
      age: age || undefined,
      specialNeeds: specialNeeds || undefined,
      notes: notes || undefined,
    };
  }

  /** Met à jour la liste des subjects et émet l'événement en mode création */
  private updateSubjects(subjects: TempSubject[]): void {
    this.tempSubjects.set(subjects);

    if (!this.isEditMode()) {
      this.subjectsChange.emit(subjects);
    }
  }

  // Méthodes pour gérer les subjects
  protected onAddSubject(): void {
    this.editingSubjectIndex.set(null);
    this.subjectForm.reset();
    this.showSubjectForm.set(true);
  }

  protected onEditSubject(index: number): void {
    const subject = this.tempSubjects()[index];
    this.editingSubjectIndex.set(index);
    this.subjectForm.reset({
      type: subject.type,
      name: subject.name,
      breed: subject.breed || '',
      age: subject.age || null,
      specialNeeds: subject.specialNeeds || '',
      notes: subject.notes || '',
    });
    this.showSubjectForm.set(true);
  }

  protected onDeleteSubject(index: number): void {
    const subject = this.tempSubjects()[index];

    // En mode édition, supprimer directement via le store
    if (this.isEditMode() && subject.isExisting && subject.id) {
      this.store.deleteSubject(subject.id);
    } else {
      // En mode création ou pour les subjects non persistés, juste retirer de la liste
      const subjects = [...this.tempSubjects()];
      subjects.splice(index, 1);
      this.updateSubjects(subjects);
    }
  }

  protected onCancelSubjectForm(): void {
    this.showSubjectForm.set(false);
    this.editingSubjectIndex.set(null);
    this.subjectForm.reset();
  }

  protected onSaveSubject(): void {
    this.subjectForm.markAllAsTouched();
    if (this.subjectForm.invalid) return;

    const editingIndex = this.editingSubjectIndex();
    const payload = this.getSubjectPayloadFromForm();

    if (this.isEditMode()) {
      this.saveInEditMode(editingIndex, payload);
    } else {
      this.saveInCreateMode(editingIndex, payload);
    }

    this.onCancelSubjectForm();
  }

  /** Sauvegarde en mode édition (persistance immédiate) */
  private saveInEditMode(editingIndex: number | null, payload: Omit<TempSubject, 'tempId' | 'id' | 'isExisting'>): void {
    const clientId = this.clientId();
    if (!clientId) return;

    if (editingIndex !== null) {
      const existingSubject = this.tempSubjects()[editingIndex];
      if (existingSubject.isExisting && existingSubject.id) {
        this.store.updateSubject({
          id: existingSubject.id,
          data: { clientId, ...payload },
        });
      }
    } else {
      this.store.createSubject({ clientId, ...payload });
    }
  }

  /** Sauvegarde en mode création (gestion mémoire) */
  private saveInCreateMode(editingIndex: number | null, payload: Omit<TempSubject, 'tempId' | 'id' | 'isExisting'>): void {
    const subjects = [...this.tempSubjects()];

    if (editingIndex !== null) {
      subjects[editingIndex] = { ...subjects[editingIndex], ...payload };
    } else {
      subjects.push({ tempId: crypto.randomUUID(), ...payload });
    }

    this.updateSubjects(subjects);
  }
}
