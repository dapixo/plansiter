import { Component, input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TranslocoModule } from '@jsverse/transloco';
import { RouterModule } from '@angular/router';
import { BookingDetail } from '../calendar';
import { LanguageService } from '@application/services';

@Component({
  selector: 'app-booking-detail-popover',
  standalone: true,
  imports: [CommonModule, ButtonModule, TranslocoModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="dialog"
      aria-labelledby="popover-title"
      aria-describedby="popover-content"
    >
      <!-- Header -->
      <header class="border-b border-gray-200 px-4 py-3">
        @if (detail(); as bookingDetail) {
        <h3 id="popover-title" class="text-gray-900 font-semibold text-base pr-8">
          {{ bookingDetail.subjectName }}
        </h3>
        <p class="text-gray-500 text-xs mt-1">
          <time [attr.datetime]="bookingDetail.startDate">
            {{ bookingDetail.startDate | date : 'dd/MM/yyyy' }}
          </time>
          -
          <time [attr.datetime]="bookingDetail.endDate">
            {{ bookingDetail.endDate | date : 'dd/MM/yyyy' }}
          </time>
        </p>
        <p class="text-sm font-medium text-gray-900">{{ bookingDetail.serviceName }}</p>
        }
      </header>

      <!-- Content -->
      <div id="popover-content" class="p-4 space-y-3">
        @if (detail(); as bookingDetail) {
        <!-- Client - Clickable -->
        <a
          [routerLink]="getClientDetailLink(bookingDetail.clientId)"
          class="block rounded p-3 border border-gray-200 hover:border-indigo-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          [attr.aria-label]="'booking.viewClientDetail' | transloco"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
            >
              {{ bookingDetail.clientName.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm text-gray-900 truncate">
                {{ bookingDetail.clientName }}
              </p>
              <p class="text-xs text-gray-500 truncate">{{ bookingDetail.clientAddress }}</p>
            </div>
            <svg
              class="w-4 h-4 text-gray-400 transition-colors flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </a>
        }
      </div>
    </div>
  `,
})
export class BookingDetailPopoverComponent {
  readonly detail = input<BookingDetail | null>(null);
  private languageService = inject(LanguageService);
  protected currentLang = this.languageService.currentLang;

  getClientDetailLink(clientId: string): string[] {
    return [`/${this.currentLang()}`, 'dashboard', 'clients', clientId];
  }
}
