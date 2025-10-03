import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputOtpModule } from 'primeng/inputotp';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@application/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputOtpModule,
    CardModule,
    MessageModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  email = signal<string>('');
  otpCode = signal<string>('');
  isLoading = signal<boolean>(false);
  otpSent = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async sendOtp() {
    const emailValue = this.email();

    if (!emailValue || !this.isValidEmail(emailValue)) {
      this.errorMessage.set('Veuillez entrer une adresse email valide');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.sendOtpCode(emailValue);
      this.otpSent.set(true);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Une erreur est survenue');
    } finally {
      this.isLoading.set(false);
    }
  }

  async verifyOtp() {
    const emailValue = this.email();
    const codeValue = this.otpCode();

    if (!codeValue || codeValue.length !== 6) {
      this.errorMessage.set('Veuillez entrer le code à 6 chiffres');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.verifyOtpCode(emailValue, codeValue);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Code invalide ou expiré');
      this.isLoading.set(false);
    }
  }

  resetForm() {
    this.otpSent.set(false);
    this.otpCode.set('');
    this.errorMessage.set('');
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
