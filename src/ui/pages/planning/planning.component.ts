import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent, type TimelineBar } from '@ui/components/calendar';
import { BookingFormDialogComponent } from '@ui/components/booking-form-dialog/booking-form-dialog.component';
import { BookingStore, calculateBookingStatus } from '@application/stores/booking.store';
import { ClientStore } from '@application/stores/client.store';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, CalendarComponent, BookingFormDialogComponent],
  templateUrl: './planning.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanningComponent {
  protected readonly bookingStore = inject(BookingStore);
  private readonly clientStore = inject(ClientStore);
  protected readonly bookingDialogVisible = signal(false);

  // Map pour accès rapide aux subjects par ID
  private readonly subjectsMap = computed(() => {
    const map = new Map();
    this.clientStore.subjects().forEach(subject => map.set(subject.id, subject));
    return map;
  });

  // Convertir les bookings en TimelineBar pour le calendrier
  protected readonly timelineBars = computed<TimelineBar[]>(() => {
    return this.bookingStore.bookings().map((booking) => {
      const subject = this.subjectsMap().get(booking.subjectId);
      return {
        id: booking.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        title: subject?.name || booking.subjectId,
        status: calculateBookingStatus(booking),
        clientName: booking.clientId,
      };
    });
  });

  protected onAddBooking(): void {
    this.bookingDialogVisible.set(true);
  }
}
