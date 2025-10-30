import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { StepperModule } from 'primeng/stepper';
import { NameStepComponent } from './name-step.component';
import { CareTypesStepComponent } from './care-types-step.component';
import { ServiceStepComponent } from './service-step.component';
import { ClientStepComponent } from './client-step.component';
import { CongratulationsStepComponent } from './congratulations-step.component';

@Component({
  selector: 'app-steps-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    StepperModule,
    NameStepComponent,
    CareTypesStepComponent,
    ServiceStepComponent,
    ClientStepComponent,
    CongratulationsStepComponent,
  ],
  template: `
    <div class="flex flex-col w-full min-h-screen">
      <!-- Stepper Navigation - Fixed at top -->
      <div class="fixed top-0 left-0 right-0 bg-white shadow-sm z-10 py-4">
        <div class="max-w-6xl mx-auto px-4">
          <p-stepper [value]="currentStepIndex()" [linear]="true">
            <p-step-list>
              <p-step [value]="1">{{ 'onboarding.stepper.name' | transloco }}</p-step>
              <p-step [value]="2">{{ 'onboarding.stepper.careTypes' | transloco }}</p-step>
              <p-step [value]="3">{{ 'onboarding.stepper.service' | transloco }}</p-step>
              <p-step [value]="4">{{ 'onboarding.stepper.client' | transloco }}</p-step>
              <p-step [value]="5">{{ 'onboarding.stepper.done' | transloco }}</p-step>
            </p-step-list>
          </p-stepper>
        </div>
      </div>

      <!-- Step Content - Centered with top padding for fixed header -->
      <div class="flex justify-center w-full pt-32 px-4">
        <div class="w-full max-w-3xl">
          @if (currentStepIndex() === 1) {
            <app-name-step
              (previous)="goToPreviousStep()"
              (next)="goToNextStep()"
            />
          }
          @if (currentStepIndex() === 2) {
            <app-care-types-step
              (previous)="goToPreviousStep()"
              (next)="goToNextStep()"
            />
          }
          @if (currentStepIndex() === 3) {
            <app-service-step
              (previous)="goToPreviousStep()"
              (next)="goToNextStep()"
            />
          }
          @if (currentStepIndex() === 4) {
            <app-client-step
              (previous)="goToPreviousStep()"
              (next)="goToNextStep()"
            />
          }
          @if (currentStepIndex() === 5) {
            <app-congratulations-step />
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepsWrapperComponent {
  protected readonly currentStepIndex = signal<number>(1);

  protected goToNextStep(): void {
      this.currentStepIndex.update((index) => Math.min(index + 1, 5));
  }

  protected goToPreviousStep(): void {
    this.currentStepIndex.update((index) => Math.max(index - 1, 1));
  }
}
