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
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ActionButtonComponent } from '@ui/components/action-button/action-button.component';
import { ServiceStore } from '@application/stores/service.store';
import { AuthService } from '@application/services';
import { Service, ServiceType, PriceType } from '@domain/entities';
import { SERVICE_TYPE_OPTIONS } from '@ui/constants/service-types.constant';
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

  readonly serviceDialogVisible = model<boolean>(false);

  // UI States
  protected readonly loading = computed(() => this.store.loading());
  protected readonly error = computed(() => this.store.error());
  protected readonly success = computed(() => this.store.success());
  protected readonly lastCreated = computed(() => this.store.lastCreated());

  // Outputs
  readonly serviceCreated = output<Service>();

  // Constants
  protected readonly serviceTypes = SERVICE_TYPE_OPTIONS;
  protected readonly priceTypes = PRICE_TYPE_OPTIONS;

  // Form
  protected readonly serviceForm: FormGroup<{
    name: FormControl<string>;
    type: FormControl<ServiceType | null>;
    description: FormControl<string>;
    priceType: FormControl<PriceType | null>;
    price: FormControl<number | null>;
  }> = this.fb.group({
    name: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    type: this.fb.control<ServiceType | null>(null, { validators: Validators.required }),
    description: this.fb.control('', { nonNullable: true }),
    priceType: this.fb.control<PriceType | null>(null, { validators: Validators.required }),
    price: this.fb.control<number | null>(null, { validators: Validators.required }),
  });

  // Effects
  private successEffect_ = effect(() => {
    const success = this.success();
    const lastCreated = this.lastCreated();
    if (success && lastCreated) {
      this.serviceCreated.emit(lastCreated);
      this.serviceDialogVisible.set(false);
      this.serviceForm.reset();
    }
  });

  protected onSave(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.store.setError('No user logged in');
      return;
    }

    this.serviceForm.markAllAsTouched();
    if (this.serviceForm.invalid || this.loading()) return;

    const { name, type, description, priceType, price } = this.serviceForm.getRawValue();

    // Validation des champs required
    if (!type || !priceType || !price) {
      this.store.setError('Required fields are missing');
      return;
    }

    const serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      name,
      type,
      description: description || undefined,
      pricePerVisit: priceType === 'per-visit' ? price : undefined,
      pricePerDay: priceType === 'per-day' ? price : undefined,
      pricePerNight: priceType === 'per-night' ? price : undefined,
      isActive: true,
    };

    this.store.create(serviceData);
  }

  protected onHide(event: boolean): void {
    if (!event) {
      this.serviceDialogVisible.set(false);
      this.serviceForm.reset();
    }
  }
}
