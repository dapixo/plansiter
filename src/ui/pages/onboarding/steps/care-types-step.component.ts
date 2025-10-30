import {
  Component,
  inject,
  signal,
  computed,
  output,
  effect,
  ChangeDetectionStrategy,
  linkedSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TranslocoModule } from '@jsverse/transloco';
import { UserPreferencesStore } from '@application/stores/user-preferences.store';
import { CARE_TYPE_OPTIONS } from '@ui/constants/care-types.constant';
import { SelectableButtonWrapperDirective } from '@ui/directives/selectable-button-wrapper.directive';

@Component({
  selector: 'app-care-types-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    TranslocoModule,
    SelectableButtonWrapperDirective,
  ],
  template: `
    <section class="flex flex-col items-center gap-8">
      <header class="flex flex-col gap-2 text-center">
        <h2 class="text-2xl font-bold text-gray-900">
          {{ 'onboarding.step3.title' | transloco }}
          <span class="text-red-500" aria-hidden="true">*</span>
        </h2>
        <p class="text-gray-600 max-w-xl">
          {{ 'onboarding.step3.subtitle' | transloco }}
        </p>
      </header>

      <form (ngSubmit)="saveAndContinue()" class="w-full flex flex-col items-center gap-8">
        <!-- Care Types Selection -->
        <fieldset
          id="care-types-group"
          role="group"
          [attr.aria-invalid]="!uiState().isValid && showValidationError()"
          [attr.aria-describedby]="
            !uiState().isValid && showValidationError() ? 'care-types-error' : null
          "
          [ngClass]="{
            'border-2 border-red-500 rounded-lg p-4': !uiState().isValid && showValidationError()
          }"
          class="w-full max-w-2xl focus-within:ring-2 focus-within:ring-blue-500"
        >
          <legend class="sr-only">
            {{ 'onboarding.step3.title' | transloco }}
          </legend>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (option of careTypeOptions; track option.value) {
            <div class="flex items-start gap-2" appSelectableButtonWrapper>
              <p-checkbox
                [inputId]="option.value"
                [value]="option.value"
                [(ngModel)]="selectedTypesSignal"
                [binary]="false"
                [ngModelOptions]="{ standalone: true }"
              />
              <label [for]="option.value" class="flex flex-col cursor-pointer select-none">
                <span class="font-medium text-gray-900">
                  {{ option.labelKey | transloco }}
                </span>
              </label>
            </div>
            }
          </div>
        </fieldset>

        <!-- Validation Error -->
        @if (!uiState().isValid && showValidationError()) {
        <div
          id="care-types-error"
          role="alert"
          tabindex="-1"
          class="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md focus:outline-none"
        >
          <p class="text-red-700 text-sm">
            {{ 'onboarding.step3.validationError' | transloco }}
          </p>
        </div>
        }

        <!-- Actions -->
        <div class="flex gap-4">
          <p-button
            type="button"
            [label]="'common.back' | transloco"
            icon="pi pi-arrow-left"
            (onClick)="goBack()"
            [outlined]="true"
            [disabled]="uiState().loading"
          />

          <p-button
            type="submit"
            [label]="'onboarding.step3.nextButton' | transloco"
            icon="pi pi-arrow-right"
            iconPos="right"
            [loading]="uiState().loading"
            [raised]="true"
          />
        </div>
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareTypesStepComponent {
  private readonly preferencesStore = inject(UserPreferencesStore);

  // Outputs
  previous = output<void>();
  next = output<void>();

  // Options
  protected readonly careTypeOptions = CARE_TYPE_OPTIONS;

  // Signals
  protected readonly showValidationError = signal(false);
  private readonly isSubmitting = signal(false);
  protected readonly selectedTypesSignal = linkedSignal(() => this.preferencesStore.careTypes());

  protected readonly uiState = computed(() => ({
    isSubmitting: this.isSubmitting(),
    loading: this.preferencesStore.loading(),
    success: this.preferencesStore.success(),
    error: this.preferencesStore.error(),
    isValid: this.selectedTypesSignal().length > 0,
  }));

  private _submitEffect = effect(() => {
    if (this.uiState().isSubmitting && this.uiState().success && !this.uiState().loading) {
      this.isSubmitting.set(false);
      this.next.emit();
    }
  });

  protected goBack(): void {
    this.previous.emit();
  }

  protected saveAndContinue(): void {
    if (this.uiState().loading) return;
    if (!this.uiState().isValid) {
      this.showValidationError.set(true);
      return;
    }
    const types = this.selectedTypesSignal();
    this.isSubmitting.set(true);
    this.preferencesStore.updateCareTypes(types);
  }
}
