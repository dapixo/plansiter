import { Directive, HostBinding } from '@angular/core';

/**
 * Directive to style radio buttons and checkboxes as selectable button-like cards.
 * Works with both PrimeNG p-radiobutton and p-checkbox components.
 * Automatically detects the checked state via native CSS :checked selector.
 * Focus style is defined in global styles.css and follows the PrimeNG theme.
 *
 * Usage:
 * <label appSelectableButtonWrapper>
 *   <p-checkbox [(ngModel)]="..." />
 *   <span>Label text</span>
 * </label>
 */
@Directive({
  selector: '[appSelectableButtonWrapper]',
  standalone: true
})
export class SelectableButtonWrapperDirective {
  @HostBinding('class')
  get classes(): string {
    return 'selectable-button-wrapper flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg transition-all cursor-pointer select-none ' +
           'hover:border-primary-300 hover:bg-primary-50 ' +
           'has-checked:border-primary-500 has-checked:bg-primary-50';
  }
}
