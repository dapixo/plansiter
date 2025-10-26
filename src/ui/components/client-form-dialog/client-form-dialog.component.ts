import {
  Component,
  inject,
  output,
  effect,
  model,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TranslocoModule } from '@jsverse/transloco';
import { TextareaModule } from 'primeng/textarea';
import { ActionButtonComponent } from '@ui/components/action-button/action-button.component';
import { ClientStore } from '@application/stores/client.store';
import { AuthService } from '@application/services';
import { Client } from '@domain/entities';

@Component({
  selector: 'app-client-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    MessageModule,
    TranslocoModule,
    TextareaModule,
    ActionButtonComponent,
  ],
  templateUrl: './client-form-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(ClientStore);
  private readonly authService = inject(AuthService);

  readonly clientDialogVisible = model<boolean>(false);

  //UI States
  protected readonly loading = computed(() => this.store.loading());
  protected readonly error = computed(() => this.store.error());
  protected readonly success = computed(() => this.store.success());
  protected readonly lastCreated = computed(() => this.store.lastCreated());

  // Outputs
  readonly clientCreated = output<Client>();

  // Form
  protected readonly clientForm: FormGroup<{
    name: FormControl<string>;
    address: FormControl<string>;
    city: FormControl<string>;
    postalCode: FormControl<string>;
    state: FormControl<string>;
    country: FormControl<string>;
    notes: FormControl<string>;
  }> = this.fb.group({
    name: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    address: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    city: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    postalCode: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    state: this.fb.control('', { nonNullable: true }),
    country: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    notes: this.fb.control('', { nonNullable: true }),
  });

  // -----------------------
  // Effects
  // -----------------------

  // Track previous visible state to detect opening
  private wasVisible = false;

  // 1) Reset state when dialog opens
  private readonly openEffect = effect(() => {
    const isVisible = this.clientDialogVisible();

    if (isVisible && !this.wasVisible) {
      // Dialog just opened - reset store state
      this.store.setError('');
    }

    this.wasVisible = isVisible;
  });

  // 2) Emit created client + close dialog after successful creation
  private readonly successEffect = effect(() => {
    const success = this.success();
    const lastCreated = this.lastCreated();

    if (success && lastCreated) {
      this.clientCreated.emit(lastCreated);
      this.clientDialogVisible.set(false);
      this.clientForm.reset();
    }
  });

  protected onSave(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    this.clientForm.markAllAsTouched();
    this.clientForm.markAllAsDirty();
    if (this.clientForm.invalid || this.loading()) return;

    const { name, address, city, postalCode, state, country, notes } =
      this.clientForm.getRawValue();

    this.store.create({
      userId,
      name,
      address,
      city,
      postalCode,
      state: state || undefined,
      country,
      notes: notes || undefined,
    });
  }

  protected onHide(event: boolean): void {
    if (!event) {
      this.clientDialogVisible.set(false);
    }
  }
}
