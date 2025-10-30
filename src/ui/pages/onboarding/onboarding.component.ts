import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepperModule } from 'primeng/stepper';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { StepsWrapperComponent } from './steps/steps-wrapper.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    StepperModule,
    TranslocoModule,
    ButtonModule,
    StepsWrapperComponent
  ],
  templateUrl: './onboarding.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
protected started = signal(false);

protected start(): void {
  this.started.set(true);
}
}
