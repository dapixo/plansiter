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
import { AuthService } from '@application/services/auth.service';
import { EMPTY } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { ActionButtonComponent } from '@ui/components/action-button/action-button.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    ActionButtonComponent,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account.component.html',
})
export class AccountComponent {
  private authService = inject(AuthService);
  private transloco = inject(TranslocoService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // Source signal from AuthService
  readonly currentUser = this.authService.currentUser;

  // State signals
  readonly isLoading = signal(false);

  // Reactive form
  readonly accountForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    name: ['', [Validators.required]],
  });

  // Computed signal for member since
  readonly memberSince = computed(() => {
    const user = this.currentUser();
    if (!user?.created_at) return '';

    const date = new Date(user.created_at);
    const locale = this.transloco.getActiveLang();

    const localeMap: Record<string, string> = {
      fr: 'fr-FR',
      es: 'es-ES',
      it: 'it-IT',
      en: 'en-GB',
    };

    return date.toLocaleDateString(localeMap[locale] || 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  private _patchFormEffect = effect(() => {
    const user = this.currentUser();
    if (user) {
      this.accountForm.patchValue({
        email: user.email ?? '',
        name: user.user_metadata?.['full_name'] ?? '',
      });
    }
  });

  onSubmit(): void {
    this.accountForm.markAllAsTouched();
    if (this.isLoading() || this.accountForm.invalid) return;

    const { email, name } = this.accountForm.getRawValue();

    this.isLoading.set(true);

    this.authService
      .updateUserProfile(email, name)
      .pipe(
        tap(() => {
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
