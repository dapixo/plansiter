import {
  Component,
  inject,
  signal,
  output,
  ChangeDetectionStrategy,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { IClientRepository, CLIENT_REPOSITORY } from '@domain/repositories';
import { AuthService } from '@application/services/auth.service';

@Component({
  selector: 'app-client-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    TranslocoModule,
    MessageModule
  ],
  template: `
    <div class="flex flex-col items-center">
      <h2 class="text-2xl font-bold text-gray-900 mb-2 text-center">
        {{ 'onboarding.step5.title' | transloco }}
      </h2>
      <p class="text-gray-600 mb-8 text-center max-w-xl">
        {{ 'onboarding.step5.subtitle' | transloco }}
      </p>

      @if (error()) {
      <p-message severity="error" class="mb-8">{{ error() }}</p-message>
      }

      <form
        [formGroup]="form"
        (ngSubmit)="saveAndContinue()"
        class="w-full max-w-md space-y-6 mb-8"
      >
        <!-- Name field -->
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
            <label for="name">{{ 'onboarding.step5.nameLabel' | transloco }}</label>
          </p-floatlabel>
          @if (form.controls.name.invalid && form.controls.name.touched) {
          <p-message id="name-error" severity="error" variant="simple" role="alert">
            {{ 'onboarding.step5.nameRequired' | transloco }}
          </p-message>
          }
        </div>

        <!-- Address field -->
        <div class="flex flex-col gap-2">
          <p-floatlabel variant="in">
            <input
              pInputText
              id="address"
              formControlName="address"
              [class.ng-invalid]="form.controls.address.invalid && form.controls.address.touched"
              [class.ng-dirty]="form.controls.address.touched"
              class="w-full"
              [attr.aria-invalid]="form.controls.address.invalid && form.controls.address.touched"
              [attr.aria-describedby]="
                form.controls.address.invalid && form.controls.address.touched ? 'address-error' : null
              "
            />
            <label for="address">{{ 'onboarding.step5.addressLabel' | transloco }}</label>
          </p-floatlabel>
          @if (form.controls.address.invalid && form.controls.address.touched) {
          <p-message id="address-error" severity="error" variant="simple" role="alert">
            {{ 'onboarding.step5.addressRequired' | transloco }}
          </p-message>
          }
        </div>

        <!-- City field -->
        <div class="flex flex-col gap-2">
          <p-floatlabel variant="in">
            <input
              pInputText
              id="city"
              formControlName="city"
              [class.ng-invalid]="form.controls.city.invalid && form.controls.city.touched"
              [class.ng-dirty]="form.controls.city.touched"
              class="w-full"
              [attr.aria-invalid]="form.controls.city.invalid && form.controls.city.touched"
              [attr.aria-describedby]="
                form.controls.city.invalid && form.controls.city.touched ? 'city-error' : null
              "
            />
            <label for="city">{{ 'onboarding.step5.cityLabel' | transloco }}</label>
          </p-floatlabel>
          @if (form.controls.city.invalid && form.controls.city.touched) {
          <p-message id="city-error" severity="error" variant="simple" role="alert">
            {{ 'onboarding.step5.cityRequired' | transloco }}
          </p-message>
          }
        </div>

        <!-- Postal Code field -->
        <div class="flex flex-col gap-2">
          <p-floatlabel variant="in">
            <input
              pInputText
              id="postalCode"
              formControlName="postalCode"
              [class.ng-invalid]="form.controls.postalCode.invalid && form.controls.postalCode.touched"
              [class.ng-dirty]="form.controls.postalCode.touched"
              class="w-full"
              [attr.aria-invalid]="form.controls.postalCode.invalid && form.controls.postalCode.touched"
              [attr.aria-describedby]="
                form.controls.postalCode.invalid && form.controls.postalCode.touched ? 'postalCode-error' : null
              "
            />
            <label for="postalCode">{{ 'onboarding.step5.postalCodeLabel' | transloco }}</label>
          </p-floatlabel>
          @if (form.controls.postalCode.invalid && form.controls.postalCode.touched) {
          <p-message id="postalCode-error" severity="error" variant="simple" role="alert">
            {{ 'onboarding.step5.postalCodeRequired' | transloco }}
          </p-message>
          }
        </div>

        <!-- Country field -->
        <div class="flex flex-col gap-2">
          <p-floatlabel variant="in">
            <input
              pInputText
              id="country"
              formControlName="country"
              [class.ng-invalid]="form.controls.country.invalid && form.controls.country.touched"
              [class.ng-dirty]="form.controls.country.touched"
              class="w-full"
              [attr.aria-invalid]="form.controls.country.invalid && form.controls.country.touched"
              [attr.aria-describedby]="
                form.controls.country.invalid && form.controls.country.touched ? 'country-error' : null
              "
            />
            <label for="country">{{ 'onboarding.step5.countryLabel' | transloco }}</label>
          </p-floatlabel>
          @if (form.controls.country.invalid && form.controls.country.touched) {
          <p-message id="country-error" severity="error" variant="simple" role="alert">
            {{ 'onboarding.step5.countryRequired' | transloco }}
          </p-message>
          }
        </div>

        <div class="flex flex-col gap-4 w-full">
          <!-- Primary actions -->
          <div class="flex gap-4 justify-center">
            <p-button
              [label]="'common.back' | transloco"
              icon="pi pi-arrow-left"
              type="button"
              (onClick)="previous.emit()"
              [outlined]="true"
              [disabled]="loading()"
            />

            <p-button
              [label]="'onboarding.step5.createButton' | transloco"
              icon="pi pi-check"
              iconPos="right"
              type="submit"
              [loading]="loading()"
              [raised]="true"
            />
          </div>

          <!-- Skip button -->
          <p-button
            [label]="'onboarding.step5.skipButton' | transloco"
            icon="pi pi-arrow-right"
            iconPos="right"
            type="button"
            (onClick)="next.emit()"
            [text]="true"
            [disabled]="loading()"
            styleClass="w-full"
          />
        </div>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientStepComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly clientRepo = inject<IClientRepository>(CLIENT_REPOSITORY);
  private readonly auth = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  previous = output<void>();
  next = output<void>();

  private readonly isSubmitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly success = signal(false);

  protected readonly uiState = computed(() => ({
    loading: this.loading(),
    success: this.success(),
    error: this.error(),
  }));

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    postalCode: ['', Validators.required],
    country: ['France', Validators.required],
  });

  protected saveAndContinue(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.loading()) return;

    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSubmitting.set(true);
    this.loading.set(true);
    this.error.set(null);

    this.clientRepo
      .create({
        userId,
        name: formValue.name,
        address: formValue.address,
        city: formValue.city,
        postalCode: formValue.postalCode,
        country: formValue.country,
        state: undefined,
        notes: undefined,
        deletedAt: undefined
      })
      .pipe(
        tap((createdClient) => {
          this.success.set(true);

          this.messageService.add({
            severity: 'success',
            summary: this.transloco.translate('onboarding.step5.successTitle'),
            detail: this.transloco.translate('onboarding.step5.successMessage', {
              name: createdClient.name,
              city: createdClient.city,
            }),
            life: 4000,
          });

          this.next.emit();
        }),
        catchError((err) => {
          this.error.set(err.message || 'An error occurred');
          return EMPTY;
        }),
        finalize(() => {
          this.loading.set(false);
          this.isSubmitting.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
