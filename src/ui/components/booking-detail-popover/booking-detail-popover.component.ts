import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TranslocoModule } from '@jsverse/transloco';
import { RouterModule } from '@angular/router';
import { BookingDetail } from '../calendar';

@Component({
  selector: 'app-booking-detail-popover',
  standalone: true,
  imports: [CommonModule, ButtonModule, TranslocoModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
  template: `
    <!-- Header sobre -->
    <div class="bg-gray-50 border-b border-gray-200 px-4 py-3 relative">
      @if (detail(); as bookingDetail) {
      <h3 id="popover-title" class="text-gray-900 font-semibold text-base pr-8">
        {{ bookingDetail.subjectName }}
      </h3>
      <p class="text-gray-500 text-xs mt-1">
        {{ bookingDetail.startDate | date : 'dd/MM/yyyy' }} -
        {{ bookingDetail.endDate | date : 'dd/MM/yyyy' }}
      </p>
      <p class="text-sm font-medium text-gray-900">{{ bookingDetail.serviceName }}</p>
      }
    </div>

    <!-- Content -->
    @if (detail(); as bookingDetail) {
    <div id="popover-content" class="p-4 space-y-3">
      <!-- Client - Clickable (Propriétaire) -->
      <div
        class="rounded p-3 border border-gray-200 hover:border-indigo-300 hover:bg-gray-50 transition-colors cursor-pointer group"
        [routerLink]="['/client', bookingDetail.clientId]"
        [attr.aria-label]="'booking.viewClientDetail' | transloco"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
          >
            {{ bookingDetail.clientName.charAt(0) }}
          </div>
          <div class="flex-1 min-w-0">
            <p
              class="font-medium text-sm text-gray-900 group-hover:text-indigo-600 transition-colors truncate"
            >
              {{ bookingDetail.clientName }}
            </p>
            <p class="text-xs text-gray-500 truncate">{{ bookingDetail.clientAddress }}</p>
          </div>
          <svg
            class="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </div>
    }
  `,
})
export class BookingDetailPopoverComponent {
  readonly detail = input<BookingDetail | null>(null);
}
