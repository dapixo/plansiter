import { Directive, HostBinding, Input } from '@angular/core';

/**
 * @deprecated Use SelectableButtonWrapperDirective instead.
 * This directive is kept for backward compatibility.
 */
@Directive({
  selector: '[appRadioButtonWrapper]',
  standalone: true
})
export class RadioButtonWrapperDirective {
  @Input() appRadioButtonWrapper: boolean = false;

  @HostBinding('class')
  get classes(): string {
    const baseClasses = 'flex items-center gap-2 p-3 border-2 rounded-lg transition-all cursor-pointer hover:border-primary-300 hover:bg-primary-50';
    const activeClasses = this.appRadioButtonWrapper
      ? 'border-primary-500 bg-primary-50'
      : 'border-gray-200';

    return `${baseClasses} ${activeClasses}`;
  }
}
