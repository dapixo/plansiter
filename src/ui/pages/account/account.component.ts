import {
  Component,
  inject,
  computed,
  signal,
  DestroyRef,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { AuthService } from '@application/services/auth.service';
import { UserPreferencesStore } from '@application/stores/user-preferences.store';
import { CareType } from '@domain/entities/user-preferences.entity';
import { EMPTY } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { CARE_TYPE_LABELS } from '@ui/constants/care-types.constant';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    MultiSelectModule,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account.component.html',
})
export class AccountComponent {
  private authService = inject(AuthService);
  private preferencesStore = inject(UserPreferencesStore);
  private transloco = inject(TranslocoService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  readonly currentUser = this.authService.currentUser;
  readonly isLoading = signal(false);

  readonly careTypeOptions = computed(() => {
    const careTypes: CareType[] = ['pet', 'plant', 'child', 'house', 'other'];
    return careTypes.map(type => ({
      label: this.transloco.translate(CARE_TYPE_LABELS[type]),
      value: type,
    }));
  });

  readonly accountForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    name: ['', [Validators.required]],
    careTypes: [[] as CareType[], [Validators.required, Validators.minLength(1)]],
  });

  private _patchFormEffect = effect(() => {
    const user = this.currentUser();
    const preferences = this.preferencesStore.preferences();

    if (user) {
      this.accountForm.patchValue({
        email: user.email ?? '',
        name: user.user_metadata?.['full_name'] ?? '',
        careTypes: preferences?.careTypes ?? [],
      });
    }
  });

  protected onSubmit(): void {
    this.accountForm.markAllAsTouched();
    if (this.isLoading() || this.accountForm.invalid) return;

    const { email, name, careTypes } = this.accountForm.getRawValue();

    this.isLoading.set(true);

    this.authService
      .updateUserProfile({email, name})
      .pipe(
        tap(() => {
          this.preferencesStore.updateCareTypes(careTypes);

          this.messageService.add({
            severity: 'success',
            summary: this.transloco.translate('common.success'),
            detail: this.transloco.translate('account.updateSuccess'),
            life: 3000,
          });
        }),
        catchError((error) => {
          console.error('Error updating profile:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate('common.error'),
            detail: this.transloco.translate('account.updateError'),
            life: 5000,
          });
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
