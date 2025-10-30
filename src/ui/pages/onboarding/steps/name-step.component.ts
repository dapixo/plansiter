import {
  Component,
  inject,
  signal,
  output,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslocoModule } from '@jsverse/transloco';
import { tap, catchError, finalize } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { AuthService } from '@application/services/auth.service';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-name-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    TranslocoModule,
    MessageModule,
  ],
  template: `
    <section class="flex flex-col items-center gap-8">
      <!-- Title -->
      <header class="flex flex-col gap-2">
        <h2 class="text-2xl font-bold text-gray-900 text-center">
          {{ 'onboarding.step2.title' | transloco }}
        </h2>
        <p class="text-gray-600 text-center max-w-xl">
          {{ 'onboarding.step2.subtitle' | transloco }}
        </p>
      </header>

      @if (errorMessage()) {
      <p-message severity="error">{{ errorMessage() }}</p-message>
      }

      <form [formGroup]="form" class="w-full max-w-md flex flex-col items-center gap-8">
        <label for="name" class="sr-only">{{ 'onboarding.step2.nameLabel' | transloco }}</label>
        <input
          pInputText
          id="name"
          formControlName="name"
          class="w-full"
          placeholder="Ace Ventura"
        />

        <p-button
          [label]="'onboarding.step2.nextButton' | transloco"
          type="submit"
          icon="pi pi-arrow-right"
          iconPos="right"
          (onClick)="saveAndContinue()"
          [loading]="isLoading()"
          [raised]="true"
        />
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NameStepComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  previous = output<void>();
  next = output<void>();

  protected readonly form = this.fb.group({
    name: [''],
  });

  protected readonly isLoading = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    // Pre-fill name from user metadata if available
    const currentName = this.authService.currentUser()?.user_metadata?.['full_name'];
    if (currentName) {
      this.form.patchValue({ name: currentName });
    }
  }

  protected saveAndContinue(): void {
    const name = this.form.value.name?.trim();
    if (!name) return this.next.emit();
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService
      .updateUserProfile({ name })
      .pipe(
        catchError((error) => {
          this.errorMessage.set(error.message || 'onboarding.step2.error');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false)),
        tap(() => this.next.emit()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
