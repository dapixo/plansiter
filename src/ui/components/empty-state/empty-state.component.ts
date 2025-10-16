import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  /** Icône à afficher (classe PrimeIcons) */
  readonly icon = input.required<string>();

  /** Clé de traduction pour le message principal */
  readonly messageKey = input.required<string>();

  /** Clé de traduction pour le texte du bouton d'action */
  readonly actionLabelKey = input.required<string>();

  /** Route vers laquelle naviguer lors du clic sur l'action */
  readonly actionRoute = input.required<string>();

  /** Clé de traduction pour l'aria-label du bouton */
  readonly actionAriaLabelKey = input<string | null>(null);
}
