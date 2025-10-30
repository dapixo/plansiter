import {
  Component,
  inject,
  signal,
  computed,
  output,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { CareType } from '@domain/entities/user-preferences.entity';
import { ServiceStore } from '@application/stores/service.store';
import { UserPreferencesStore } from '@application/stores/user-preferences.store';
import { AuthService } from '@application/services/auth.service';
import { CARE_TYPE_OPTIONS } from '@ui/constants/care-types.constant';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-service-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    FloatLabelModule,
    TranslocoModule,
    MessageModule,
  ],
  template: `
    <div class="flex flex-col items-center">
      <h2 class="text-2xl font-bold text-gray-900 mb-2 text-center">
        {{ 'onboarding.step4.title' | transloco }}
      </h2>
      <p class="text-gray-600 mb-8 text-center max-w-xl">
        {{ 'onboarding.step4.subtitle' | transloco }}
      </p>

      @if (serviceStore.error()) {
      <p-message severity="error" class="mb-8">{{ serviceStore.error() }}</p-message>
      }

      <form
        [formGroup]="form"
        (ngSubmit)="saveAndContinue()"
        class="w-full max-w-md space-y-6 mb-8"
      >
        <div class="flex flex-col gap-2">
          <p-floatlabel variant="in">
            <input
              pInputText
              id="name"
              formControlName="name"
              [class.ng-invalid]="form.controls.name.invalid && form.controls.name.touched"
              [class.ng-dirty]="form.controls.name.touched"
              class="w-full"
              [attr.aria-invalid]="form.controls.name.invalid && form.controls.name.touched"
              [attr.aria-describedby]="
                form.controls.name.invalid && form.controls.name.touched ? 'name-error' : null
              "
            />
            <label for="name">{{ 'onboarding.step4.nameLabel' | transloco }}</label>
          </p-floatlabel>
          @if (form.controls.name.invalid && form.controls.name.touched) {
          <p-message id="name-error" severity="error" variant="simple" role="alert">
            {{ 'onboarding.step4.nameRequired' | transloco }}
          </p-message>
          }
        </div>

        @if (selectedCareTypes().length > 1) {
        <div class="flex flex-col gap-2">
          <p-floatlabel variant="in">
            <p-select
              id="type"
              formControlName="type"
              [options]="availableTypeOptions()"
              optionLabel="label"
              optionValue="value"
              [class.ng-invalid]="form.controls.type.invalid && form.controls.type.touched"
              [class.ng-dirty]="form.controls.type.touched"
              class="w-full"
              [attr.aria-invalid]="form.controls.type.invalid && form.controls.type.touched"
              [attr.aria-describedby]="
                form.controls.type.invalid && form.controls.type.touched ? 'type-error' : null
              "
            />
            <label for="type">{{ 'onboarding.step4.typeLabel' | transloco }}</label>
          </p-floatlabel>
          @if (form.controls.type.invalid && form.controls.type.touched) {
          <p-message id="type-error" severity="error" variant="simple" role="alert">
            {{ 'onboarding.step4.typeRequired' | transloco }}
          </p-message>
          }
        </div>
        }

        <div class="flex flex-col gap-2">
          <p-floatlabel variant="in">
            <p-inputnumber
              inputId="pricePerVisit"
              formControlName="pricePerVisit"
              mode="currency"
              currency="EUR"
              locale="fr-FR"
              [min]="0"
              [class.ng-invalid]="
                form.controls.pricePerVisit.invalid && form.controls.pricePerVisit.touched
              "
              [class.ng-dirty]="form.controls.pricePerVisit.touched"
              class="w-full"
              [attr.aria-invalid]="
                form.controls.pricePerVisit.invalid && form.controls.pricePerVisit.touched
              "
              [attr.aria-describedby]="
                form.controls.pricePerVisit.invalid && form.controls.pricePerVisit.touched
                  ? 'price-error'
                  : null
              "
            />
            <label for="pricePerVisit">{{ 'onboarding.step4.priceLabel' | transloco }}</label>
          </p-floatlabel>
          @if (form.controls.pricePerVisit.invalid && form.controls.pricePerVisit.touched) {
          <p-message id="price-error" severity="error" variant="simple" role="alert">
            {{ 'onboarding.step4.priceRequired' | transloco }}
          </p-message>
          }
        </div>
        <div class="flex flex-col gap-4 w-full">
          <div class="flex gap-4 justify-center">
            <p-button
              [label]="'common.back' | transloco"
              icon="pi pi-arrow-left"
              type="button"
              (onClick)="previous.emit()"
              [outlined]="true"
              [disabled]="serviceStore.loading()"
            />

            <p-button
              [label]="'onboarding.step4.createButton' | transloco"
              icon="pi pi-check"
              iconPos="right"
              type="submit"
              [loading]="serviceStore.loading()"
              [raised]="true"
            />
          </div>

          <p-button
            [label]="'onboarding.step4.skipButton' | transloco"
            icon="pi pi-arrow-right"
            iconPos="right"
            type="button"
            (onClick)="next.emit()"
            [text]="true"
            [disabled]="serviceStore.loading()"
            styleClass="w-full"
          />
        </div>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceStepComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly serviceStore = inject(ServiceStore);
  private readonly preferencesStore = inject(UserPreferencesStore);
  private readonly auth = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly transloco = inject(TranslocoService);

  previous = output<void>();
  next = output<void>();

  private readonly isSubmitting = signal(false);

  protected readonly selectedCareTypes = computed(() => this.preferencesStore.careTypes());
  protected readonly availableTypeOptions = computed(() => {
    const selected = this.selectedCareTypes();
    return CARE_TYPE_OPTIONS.filter((opt) => selected.includes(opt.value)).map((opt) => ({
      label: this.transloco.translate(opt.labelKey),
      value: opt.value,
    }));
  });
  protected readonly uiState = computed(() => ({
    loading: this.serviceStore.loading(),
    success: this.serviceStore.success(),
    error: this.serviceStore.error(),
  }));

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    type: [null as CareType | null, Validators.required],
    pricePerVisit: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  private _selectedCareTypesEffect = effect(() => {
    const types = this.selectedCareTypes();
    if (types.length === 1) {
      this.form.patchValue({ type: types[0] });
    }
  });

  private _submitEffect = effect(() => {
    if (this.isSubmitting() && this.uiState().success && !this.uiState().loading) {
      const createdService = this.serviceStore.lastCreated();

      if (createdService) {
        const careTypeOption = CARE_TYPE_OPTIONS.find((opt) => opt.value === createdService.type);
        const careTypeLabel = careTypeOption
          ? this.transloco.translate(careTypeOption.labelKey)
          : createdService.type;

        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate('onboarding.step4.successTitle'),
          detail: this.transloco.translate('onboarding.step4.successMessage', {
            name: createdService.name,
            type: careTypeLabel,
            price: createdService.pricePerVisit,
          }),
          life: 4000,
        });

        this.isSubmitting.set(false);
        this.next.emit();
      }
    }

    if (this.isSubmitting() && this.uiState().error && !this.uiState().loading) {
      this.isSubmitting.set(false);
    }
  });

  protected saveAndContinue(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.serviceStore.loading()) return;

    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSubmitting.set(true);

    this.serviceStore.create({
      userId,
      name: formValue.name,
      type: formValue.type!,
      pricePerVisit: formValue.pricePerVisit!,
    });
  }
}
