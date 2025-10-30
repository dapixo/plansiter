import { Component, inject, ChangeDetectionStrategy, signal, effect, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TranslocoModule } from '@jsverse/transloco';
import { UserPreferencesStore } from '@application/stores/user-preferences.store';
import { LanguageService } from '@application/services/language.service';

@Component({
  selector: 'app-congratulations-step',
  standalone: true,
  imports: [CommonModule, ButtonModule, TranslocoModule],
  template: `
    <div class="flex flex-col items-center justify-center py-12">

      <!-- Congratulations Title -->
      <h2 class="text-3xl font-bold text-gray-900 mb-4 text-center">
        {{ 'onboarding.step6.title' | transloco }}
      </h2>

      <!-- Subtitle -->
      <p class="text-lg text-gray-600 text-center max-w-2xl mb-6">
        {{ 'onboarding.step6.subtitle' | transloco }}
      </p>

      <!-- Message -->
      <div class="bg-white rounded-lg shadow-sm p-6 max-w-xl mb-8">
        <p class="text-gray-700 text-center leading-relaxed">
          {{ 'onboarding.step6.message' | transloco }}
        </p>
      </div>

      <!-- Dashboard Button -->
      <p-button
        [label]="'onboarding.step6.dashboardButton' | transloco"
        icon="pi pi-home"
        iconPos="right"
        size="large"
        (onClick)="completedOnboarding()"
        [loading]="isNavigating()"
        [raised]="true"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CongratulationsStepComponent {
  private readonly preferencesStore = inject(UserPreferencesStore);
  private readonly router = inject(Router);
  private readonly lang = inject(LanguageService);

  protected readonly isNavigating = signal(false);

  protected readonly uiState = computed(() => ({
    loading: this.preferencesStore.loading(),
    success: this.preferencesStore.success(),
    error: this.preferencesStore.error(),
  }));

  private _navigationEffect = effect(() => {
    if (this.isNavigating() && this.uiState().success && !this.uiState().loading) {
      // Navigate to dashboard
      const currentLang = this.lang.getCurrentLanguage();
      this.router.navigate([`/${currentLang}/dashboard`]);
    }
  });

  /**
   * Mark onboarding as completed and navigate to dashboard
   */
  protected completedOnboarding(): void {
    if (this.isNavigating()) return;

    this.isNavigating.set(true);

    // Mark as onboarded in database
    this.preferencesStore.markAsOnboarded();
  }
}
