import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

type ButtonVariant = 'primary' | 'secondary' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule],
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionButtonComponent {
  /** Route vers laquelle naviguer (si fourni, c'est un lien) */
  readonly route = input<string | null>(null);

  /** Clé de traduction pour le label */
  readonly labelKey = input.required<string>();

  /** Icône à afficher (classe PrimeIcons) */
  readonly icon = input<string | null>(null);

  /** Position de l'icône */
  readonly iconPosition = input<'left' | 'right'>('left');

  /** Variante du bouton */
  readonly variant = input<ButtonVariant>('primary');

  /** Taille du bouton */
  readonly size = input<ButtonSize>('md');

  /** Clé de traduction pour l'aria-label (optionnel) */
  readonly ariaLabelKey = input<string | null>(null);

  /** Type de bouton (submit, button) - ignoré si route est fourni */
  readonly type = input<'button' | 'submit'>('button');

  /** État de chargement */
  readonly loading = input<boolean>(false);

  /** État désactivé */
  readonly disabled = input<boolean>(false);

  /** Classes CSS calculées selon la variante */
  protected get variantClasses(): string {
    const baseClasses = 'inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-200';

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5',
      lg: 'px-6 py-3 text-lg'
    };

    const variantClasses = {
      primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg',
      secondary: 'bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 shadow-sm',
      text: 'text-indigo-600 hover:text-indigo-700'
    };

    return `${baseClasses} ${sizeClasses[this.size()]} ${variantClasses[this.variant()]}`;
  }
}
