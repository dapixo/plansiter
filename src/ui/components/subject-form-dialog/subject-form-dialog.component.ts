import {
  Component,
  inject,
  input,
  output,
  effect,
  model,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TranslocoModule } from '@jsverse/transloco';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { Subject, SubjectType } from '@domain/entities';
import { ActionButtonComponent } from '@ui/components/action-button/action-button.component';
import { SUBJECT_TYPES } from '@ui/constants/subject-types.constant';
import { ClientStore } from '@application/stores/client.store';
import { TempSubject } from '@application/services/client-management.service';

@Component({
  selector: 'app-subject-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    MessageModule,
    TranslocoModule,
    SelectModule,
    InputNumberModule,
    TextareaModule,
    ActionButtonComponent,
  ],
  templateUrl: './subject-form-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubjectFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(ClientStore);

  // Inputs
  readonly clientId = input<string | undefined>();
  readonly subject = input<Partial<Subject | TempSubject> | null>(null);
  readonly subjectDialogVisible = model<boolean>(false);

  // Outputs
  readonly subjectSaved = output<Omit<Subject, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>>();

  // Store-derived signals
  protected readonly loading = computed(() => this.store.loading());
  protected readonly success = computed(() => this.store.success());
  protected readonly error = computed(() => this.store.error());
  protected readonly lastCreatedSubject = computed(() => this.store.lastCreatedSubject());

  // State
  protected readonly isEditMode = computed(() => !!this.subject()?.id);
  protected readonly isInEditMode = computed(() => !!this.clientId());
  protected readonly subjectTypes = SUBJECT_TYPES;

  // Form
  protected readonly subjectForm = this.fb.group({
    type: this.fb.control<SubjectType | null>(null, Validators.required),
    name: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    breed: this.fb.control('', { nonNullable: true }),
    age: this.fb.control<number | null>(null),
    specialNeeds: this.fb.control('', { nonNullable: true }),
    notes: this.fb.control('', { nonNullable: true }),
  });

  private lastSubject: Partial<Subject> | null = null;

  // Effect
  private successEffect_ = effect(() => {
    const success = this.success();
    const subject = this.lastCreatedSubject();
    if (success) {
      this.subjectDialogVisible.set(false);
    }
  });

private subjectEffect_ = effect(() => {
  const s = this.subject();
  if (s === this.lastSubject) return;
  this.lastSubject = s;

  if (s) {
    this.subjectForm.patchValue({
      type: s.type ?? null,
      name: s.name ?? '',
      breed: s.breed ?? '',
      age: s.age ?? null,
      specialNeeds: s.specialNeeds ?? '',
      notes: s.notes ?? '',
    });
  } else {
    this.subjectForm.reset();
  }
});

  // 🔹 Actions
  protected onSave(): void {
    this.subjectForm.markAllAsTouched();
    this.subjectForm.markAllAsDirty();
    if (this.subjectForm.invalid || this.loading()) return;

    const { type, name, breed, age, specialNeeds, notes } = this.subjectForm.getRawValue();
    const payload = {
      type: type!,
      name,
      breed: breed || undefined,
      age: age || undefined,
      specialNeeds: specialNeeds || undefined,
      notes: notes || undefined,
    };

    // Mode création sur client existant (persisté)
    if (this.isInEditMode() && !this.isEditMode()) {
      this.store.createSubject({ clientId: this.clientId()!, ...payload });
    }
    // Mode édition sur subject persisté
    else if (this.isInEditMode() && this.isEditMode()) {
      const subjectId = this.subject()?.id;
      if (subjectId) {
        this.store.updateSubject({ id: subjectId, data: payload });
      }
    }
    // Mode temporaire (création de client)
    else {
      this.subjectSaved.emit(payload);
    }
  }

  protected onHide(event: boolean): void {
    if (!event) this.subjectDialogVisible.set(false);
    this.subjectForm.reset();
  }
}
