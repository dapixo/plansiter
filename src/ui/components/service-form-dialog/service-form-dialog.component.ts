import {
  Component,
  inject,
  model,
  input,
  output,
  effect,
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
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ActionButtonComponent } from '@ui/components/action-button/action-button.component';
import { ServiceStore } from '@application/stores/service.store';
import { UserPreferencesStore } from '@application/stores/user-preferences.store';
import { AuthService } from '@application/services';
import { Service, PriceType } from '@domain/entities';
import { CareType } from '@domain/entities/user-preferences.entity';
import { CARE_TYPE_OPTIONS } from '@ui/constants/care-types.constant';
import { PRICE_TYPE_OPTIONS } from '@ui/constants/price-types.constant';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RadioButtonWrapperDirective } from '@ui/directives/radio-button-wrapper.directive';

@Component({
  selector: 'app-service-form-dialog',
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
    RadioButtonModule,
    RadioButtonWrapperDirective,
    ActionButtonComponent,
  ],
  templateUrl: './service-form-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(ServiceStore);
  private readonly authService = inject(AuthService);
  private readonly preferencesStore = inject(UserPreferencesStore);
  private readonly transloco = inject(TranslocoService);

  readonly serviceDialogVisible = model<boolean>(false);
  readonly prefilledType = input<CareType | null>(null);
  readonly serviceCreated = output<Service>();

  protected readonly loading = computed(() => this.store.loading());
  protected readonly error = computed(() => this.store.error());
  protected readonly success = computed(() => this.store.success());
  protected readonly lastCreated = computed(() => this.store.lastCreated());
  protected readonly isTypeSelectHidden = computed(() => !!this.prefilledType());

  protected readonly priceTypes = PRICE_TYPE_OPTIONS;
  protected readonly serviceTypes = computed(() => {
    const userCareTypes = this.preferencesStore.careTypes();
    if (userCareTypes.length === 0) return CARE_TYPE_OPTIONS;
    return CARE_TYPE_OPTIONS.filter(opt => userCareTypes.includes(opt.value));
  });

  protected readonly serviceForm: FormGroup<{
    name: FormControl<string>;
    type: FormControl<CareType | null>;
    description: FormControl<string>;
    priceType: FormControl<PriceType | null>;
    price: FormControl<number | null>;
  }> = this.fb.group({
    name: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    type: this.fb.control<CareType | null>(null, { validators: Validators.required }),
    description: this.fb.control('', { nonNullable: true }),
    priceType: this.fb.control<PriceType | null>(null, { validators: Validators.required }),
    price: this.fb.control<number | null>(null, { validators: Validators.required }),
  });

  protected readonly dialogTitle = computed(() => {
    const type = this.prefilledType();
    if (!type) return this.transloco.translate('services.createService');

    const typeOption = CARE_TYPE_OPTIONS.find(opt => opt.value === type);
    const typeLabel = typeOption ? this.transloco.translate(typeOption.labelKey) : '';
    return this.transloco.translate('services.form.createServiceForType', { type: typeLabel });
  });

  // -----------------------
  // Effects
  // -----------------------

  // Track previous visible state to detect opening
  private wasVisible = false;

  // 1) Reset state when dialog opens
  private readonly openEffect = effect(() => {
    const isVisible = this.serviceDialogVisible();

    if (isVisible && !this.wasVisible) {
      // Dialog just opened - reset store state
      this.store.setError('');
    }

    this.wasVisible = isVisible;
  });

  // 2) Emit created service + close dialog after successful creation
  private readonly successEffect = effect(() => {
    const success = this.success();
    const lastCreated = this.lastCreated();

    if (success && lastCreated) {
      this.serviceCreated.emit(lastCreated);
      this.serviceDialogVisible.set(false);
      this.serviceForm.reset({
        name: '',
        type: null,
        description: '',
        priceType: null,
        price: null,
      });
    }
  });

  // 3) Prefill and lock the "type" control while dialog is open and prefilledType set
  private readonly prefilledTypeEffect = effect(() => {
    const type = this.prefilledType();
    const isVisible = this.serviceDialogVisible();

    const typeControl = this.serviceForm.controls.type;
    if (isVisible && type) {
      // idempotent disable/patch
      if (typeControl.value !== type) {
        typeControl.patchValue(type);
      }
      if (!typeControl.disabled) typeControl.disable();
    } else {
      if (typeControl.disabled) typeControl.enable();
    }
  });

  protected onSave(): void {
    this.serviceForm.markAllAsTouched();
    if (this.loading()) return;
    if (this.serviceForm.invalid) {
      this.store.setError(this.transloco.translate('common.error'));
      return;
    }

    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.store.setError(this.transloco.translate('common.error'));
      return;
    }

    const { name, type, description, priceType, price } = this.serviceForm.getRawValue();

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      this.store.setError(this.transloco.translate('common.error'));
      return;
    }

    const serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      name,
      type: type!,
      description: description || undefined,
      pricePerVisit: priceType === 'per-visit' ? numericPrice : undefined,
      pricePerDay: priceType === 'per-day' ? numericPrice : undefined,
      pricePerNight: priceType === 'per-night' ? numericPrice : undefined,
    };

    this.store.create(serviceData);
  }

  protected onHide(visible: boolean): void {
    if (!visible) {
      this.serviceDialogVisible.set(false);
    }
  }
}
