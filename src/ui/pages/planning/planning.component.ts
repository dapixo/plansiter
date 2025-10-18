import { Component, inject, ChangeDetectionStrategy, signal, computed, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DateAdapter,
  CalendarEvent,
  CalendarView,
  CalendarUtils,
  CalendarA11y,
  CalendarDateFormatter,
  CalendarEventTitleFormatter,
  CalendarMonthViewComponent,
  CalendarWeekViewComponent,
  CalendarDayViewComponent
} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { startOfWeek, endOfWeek, format, addMonths, addDays, addWeeks } from 'date-fns';
import { AuthService } from '@application/services';
import { Booking } from '@domain/entities';
import { IBookingRepository, BOOKING_REPOSITORY } from '@domain/repositories';
import { tap, catchError, finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { BookingFormDialogComponent } from '@ui/components/booking-form-dialog/booking-form-dialog.component';
import { BOOKING_STATUS_COLORS } from '@ui/constants/booking-status-colors.constant';
import { LOCALE_MAP, LocaleKey } from '@ui/constants/locale-map.constant';
import { CALENDAR_VIEW_OPTIONS } from '@ui/constants/calendar-view-options.constant';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarMonthViewComponent,
    CalendarWeekViewComponent,
    CalendarDayViewComponent,
    ButtonModule,
    SelectModule,
    TranslocoModule,
    BookingFormDialogComponent
  ],
  providers: [
    {
      provide: DateAdapter,
      useFactory: adapterFactory,
    },
    CalendarUtils,
    CalendarA11y,
    CalendarDateFormatter,
    CalendarEventTitleFormatter
  ],
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanningComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly bookingRepo = inject<IBookingRepository>(BOOKING_REPOSITORY);
  private readonly authService = inject(AuthService);
  private readonly transloco = inject(TranslocoService);

  // State
  protected readonly viewDate = signal(new Date());
  protected readonly view = signal<CalendarView>(CalendarView.Week);
  protected readonly bookings = signal<Booking[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly bookingDialogVisible = signal(false);

  // Computed
  protected readonly events = computed<CalendarEvent[]>(() => {
    return this.bookings().map(booking => ({
      id: booking.id,
      start: new Date(booking.startDate),
      end: new Date(booking.endDate),
      title: this.getBookingTitle(booking),
      color: this.getBookingColor(booking.status),
      meta: { booking }
    }));
  });

  private readonly currentLocale = computed(() => {
    const lang = this.transloco.getActiveLang();
    return LOCALE_MAP[lang as LocaleKey] || LOCALE_MAP.en;
  });

  protected readonly locale = computed(() => this.currentLocale().code);
  protected readonly dateFnsLocale = computed(() => this.currentLocale().locale);

  protected readonly periodLabel = computed(() => {
    const date = this.viewDate();
    const currentView = this.view();
    const dateLocale = this.dateFnsLocale();

    switch (currentView) {
      case CalendarView.Month:
        return format(date, 'MMMM yyyy', { locale: dateLocale });
      case CalendarView.Week: {
        const start = startOfWeek(date, { locale: dateLocale });
        const end = endOfWeek(date, { locale: dateLocale });
        return `${format(start, 'd MMM', { locale: dateLocale })} - ${format(end, 'd MMM yyyy', { locale: dateLocale })}`;
      }
      case CalendarView.Day:
        return format(date, 'EEEE d MMMM yyyy', { locale: dateLocale });
      default:
        return '';
    }
  });

  // View enum for template
  protected readonly CalendarView = CalendarView;
  protected readonly viewOptions = CALENDAR_VIEW_OPTIONS;

  // Effect to load bookings on init
  private readonly loadBookingsEffect_ = effect(() => {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.error.set('No user logged in');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.bookingRepo.getBySitterId(userId).pipe(
      tap(bookings => this.bookings.set(bookings)),
      catchError(error => {
        this.error.set(error instanceof Error ? error.message : String(error));
        return EMPTY;
      }),
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  });

  protected setView(view: CalendarView): void {
    this.view.set(view);
  }

  protected navigatePeriod(direction: 'prev' | 'next'): void {
    const currentView = this.view();
    const currentDate = this.viewDate();
    const multiplier = direction === 'prev' ? -1 : 1;

    let newDate: Date;
    switch (currentView) {
      case CalendarView.Month:
        newDate = addMonths(currentDate, multiplier);
        break;
      case CalendarView.Week:
        newDate = addWeeks(currentDate, multiplier);
        break;
      case CalendarView.Day:
        newDate = addDays(currentDate, multiplier);
        break;
      default:
        return;
    }

    this.viewDate.set(newDate);
  }

  protected previousPeriod(): void {
    this.navigatePeriod('prev');
  }

  protected nextPeriod(): void {
    this.navigatePeriod('next');
  }

  protected today(): void {
    this.viewDate.set(new Date());
  }

  protected onEventClick(event: CalendarEvent): void {
    const booking = event.meta?.booking as Booking;
    if (booking) {
      console.log('Booking clicked:', booking);
      // TODO: ouvrir dialog avec détails de la garde
    }
  }

  protected onBookingCreated(booking: Booking): void {
    this.bookings.update(bookings => [...bookings, booking]);
  }

  protected openBookingDialog(): void {
    this.bookingDialogVisible.set(true);
  }

  private getBookingTitle(booking: Booking): string {
    // TODO: récupérer le nom du client/service depuis les stores
    return `Garde #${booking.id.slice(0, 8)}`;
  }

  private getBookingColor(status: Booking['status']): { primary: string; secondary: string } {
    return BOOKING_STATUS_COLORS[status] || BOOKING_STATUS_COLORS.pending;
  }
}
