import { Component, ChangeDetectionStrategy, signal, inject, ViewChild, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from '@ui/components/calendar';
import { BookingDetailPopoverComponent } from '@ui/components/booking-detail-popover/booking-detail-popover.component';
import { BookingFormDialogComponent } from '@ui/components/booking-form-dialog/booking-form-dialog.component';
import { BookingStore } from '@application/stores/booking.store';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, CalendarComponent, BookingDetailPopoverComponent, BookingFormDialogComponent],
  templateUrl: './planning.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class PlanningComponent implements OnInit {
  ngOnInit(): void {
    console.log(this.bookingStore.timelineBars())
  }
  @ViewChild(CalendarComponent) calendar!: CalendarComponent;

  protected readonly bookingStore = inject(BookingStore);
  protected readonly bookingDialogVisible = signal(false);

  bookingEffect = effect(()=> {
  console.log(this.bookingStore.timelineBars())
})

  protected onAddBooking(): void {
    this.bookingDialogVisible.set(true);
  }

  protected onBarClicked(bookingId: string): void {
    this.bookingStore.getBookingDetail(bookingId);
  }
}
