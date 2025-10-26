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
import { Subject } from '@domain/entities';
import { CareType } from '@domain/entities/user-preferences.entity';
import { ActionButtonComponent } from '@ui/components/action-button/action-button.component';
import { CARE_TYPE_OPTIONS } from '@ui/constants/care-types.constant';
import { ClientStore } from '@application/stores/client.store';
import { UserPreferencesStore } from '@application/stores/user-preferences.store';
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
  private readonly preferencesStore = inject(UserPreferencesStore);

  readonly clientId = input<string | undefined>();
  readonly subject = input<Partial<Subject | TempSubject> | null>(null);
  readonly subjectDialogVisible = model<boolean>(false);

  readonly subjectSaved = output<Omit<Subject, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>>();
  readonly subjectCreated = output<Subject>(); // For persisted subjects

  protected readonly loading = computed(() => this.store.loading());
  protected readonly success = computed(() => this.store.success());
  protected readonly error = computed(() => this.store.error());
  protected readonly lastCreatedSubject = computed(() => this.store.lastCreatedSubject());

  protected readonly isEditMode = computed(() => !!this.subject()?.id);
  protected readonly isInEditMode = computed(() => !!this.clientId());
  protected readonly activeCareTypes = computed(() => this.preferencesStore.careTypes());

  protected readonly subjectTypes = computed(() => {
    const userCareTypes = this.preferencesStore.careTypes();
    const currentType = this.subject()?.type;
    const isEditing = this.isEditMode();

    if (userCareTypes.length === 0) return CARE_TYPE_OPTIONS;

    // En création: uniquement les types activés
    // En édition: types activés + le type courant (même s'il est désactivé)
    return CARE_TYPE_OPTIONS.filter(option =>
      userCareTypes.includes(option.value) ||
      (isEditing && option.value === currentType)
    );
  });

  protected readonly subjectForm = this.fb.group({
    type: this.fb.control<CareType | null>(null, Validators.required),
    name: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    breed: this.fb.control('', { nonNullable: true }),
    age: this.fb.control<number | null>(null),
    specialNeeds: this.fb.control('', { nonNullable: true }),
    notes: this.fb.control('', { nonNullable: true }),
  });

  // -----------------------
  // Effects
  // -----------------------

  // Track previous visible state to detect opening
  private wasVisible = false;
  private lastSubject: Partial<Subject> | null = null;

  // 1) Reset state when dialog opens
  private readonly openEffect = effect(() => {
    const isVisible = this.subjectDialogVisible();

    if (isVisible && !this.wasVisible) {
      // Dialog just opened - reset store state
      this.store.setError('');
    }

    this.wasVisible = isVisible;
  });

  // 2) Emit created subject + close dialog after successful creation
  private readonly successEffect = effect(() => {
    const success = this.success();
    const lastCreated = this.lastCreatedSubject();

    if (success) {
      if (lastCreated) {
        this.subjectCreated.emit(lastCreated);
      }
      this.subjectDialogVisible.set(false);
      this.subjectForm.reset();
    }
  });

  // 3) Patch form when subject input changes (for edit mode)
  private readonly subjectEffect = effect(() => {
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

    if (this.isInEditMode() && !this.isEditMode()) {
      this.store.createSubject({ clientId: this.clientId()!, ...payload });
    }
    else if (this.isInEditMode() && this.isEditMode()) {
      const subjectId = this.subject()?.id;
      if (subjectId) {
        this.store.updateSubject({ id: subjectId, data: payload });
      }
    }
    else {
      this.subjectSaved.emit(payload);
    }
  }

  protected onHide(event: boolean): void {
    if (!event) {
      this.subjectDialogVisible.set(false);
    }
  }
}
