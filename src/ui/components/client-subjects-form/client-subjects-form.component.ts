import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  effect,
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
import { SubjectStore } from '@application/stores/subject.store';
import { TempSubject } from '@application/services/client-management.service';
import { SubjectType } from '@domain/entities';

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
  private readonly subjectStore = inject(SubjectStore);

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

  // Computed pour filtrer les subjects par clientId actuel
  private readonly currentClientSubjects = computed(() => {
    const currentClientId = this.clientId();
    if (!currentClientId) return [];
    return this.subjectStore.subjects().filter(s => s.clientId === currentClientId);
  });

  // Effect pour gérer le chargement et le patch des subjects
  private readonly _subjectsEffect = effect(() => {
    const clientId = this.clientId();
    const isEditMode = this.isEditMode();

    if (!isEditMode) {
      this.updateSubjects([]);
      return;
    }

    if (!clientId) return;

    // Charger les subjects du client
    this.subjectStore.loadByClientId(clientId);

    // Convertir en TempSubjects
    const existingSubjects = this.currentClientSubjects();
    const temps: TempSubject[] = existingSubjects.map(s => ({
      tempId: s.id,
      id: s.id,
      type: s.type,
      name: s.name,
      breed: s.breed,
      age: s.age,
      specialNeeds: s.specialNeeds,
      notes: s.notes,
      isExisting: true,
    }));

    this.updateSubjects(temps);
  });

  // Méthode utilitaire pour mettre à jour et émettre
  private updateSubjects(subjects: TempSubject[]): void {
    this.tempSubjects.set(subjects);
    this.subjectsChange.emit(subjects);
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
    const subjects = [...this.tempSubjects()];
    subjects.splice(index, 1);
    this.updateSubjects(subjects);
  }

  protected onCancelSubjectForm(): void {
    this.showSubjectForm.set(false);
    this.editingSubjectIndex.set(null);
    this.subjectForm.reset();
  }

  protected onSaveSubject(): void {
    this.subjectForm.markAllAsTouched();
    if (this.subjectForm.invalid) return;

    const { type, name, breed, age, specialNeeds, notes } = this.subjectForm.value;
    const newSubject: TempSubject = {
      tempId: crypto.randomUUID(),
      type: type!,
      name: name!,
      breed: breed || undefined,
      age: age || undefined,
      specialNeeds: specialNeeds || undefined,
      notes: notes || undefined,
    };

    const subjects = [...this.tempSubjects()];
    const editingIndex = this.editingSubjectIndex();

    if (editingIndex !== null) {
      // Modification : préserver l'id et isExisting
      const existingSubject = subjects[editingIndex];
      subjects[editingIndex] = {
        ...newSubject,
        tempId: existingSubject.tempId,
        id: existingSubject.id,
        isExisting: existingSubject.isExisting,
      };
    } else {
      // Ajout
      subjects.push(newSubject);
    }

    this.updateSubjects(subjects);
    this.onCancelSubjectForm();
  }
}
