import { Component, signal, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputOtpModule } from 'primeng/inputotp';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '@application/services';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputOtpModule,
    CardModule,
    MessageModule,
    TranslocoModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private transloco = inject(TranslocoService);

  emailForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  otpForm = new FormGroup({
    otpCode: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
    }),
  });

  isLoading = signal<boolean>(false);
  otpSent = signal<boolean>(false);
  errorMessage = signal<string>('');

  sendOtp() {
    if (this.isLoading()) return;
    if (this.emailForm.invalid) {
      this.errorMessage.set(this.transloco.translate('auth.login.invalidEmail'));
      return;
    }

    const emailValue = this.emailForm.getRawValue().email;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .sendOtpCode(emailValue)
      .pipe(
        tap(() => this.otpSent.set(true)),
        catchError((error: any) => {
          this.errorMessage.set(error.message || this.transloco.translate('auth.otp.sendError'));
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  verifyOtp() {
    if (this.isLoading()) return;
    if (this.otpForm.invalid) {
      this.errorMessage.set(this.transloco.translate('auth.otp.invalidCode'));
      return;
    }

    const emailValue = this.emailForm.getRawValue().email;
    const codeValue = this.otpForm.getRawValue().otpCode;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .verifyOtpCode(emailValue, codeValue)
      .pipe(
        catchError((error: any) => {
          this.errorMessage.set(error.message || this.transloco.translate('auth.otp.verificationError'));
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  resetForm() {
    this.otpSent.set(false);
    this.otpForm.reset();
    this.errorMessage.set('');
  }
}
