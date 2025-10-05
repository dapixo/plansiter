import { Component, inject, ChangeDetectionStrategy, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DateAdapter,
  CalendarEvent,
  CalendarView,
  CalendarUtils,
  CalendarA11y,
  CalendarDateFormatter,
  CalendarMonthViewComponent,
  CalendarWeekViewComponent,
  CalendarDayViewComponent
} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { ButtonModule } from 'primeng/button';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { fr, enUS, es, it } from 'date-fns/locale';
import { AuthService } from '@application/services';
import { Booking } from '@domain/entities';
import { IBookingRepository, BOOKING_REPOSITORY } from '@domain/repositories';
import { tap, catchError, finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [
    CommonModule,
    CalendarMonthViewComponent,
    CalendarWeekViewComponent,
    CalendarDayViewComponent,
    ButtonModule,
    TranslocoModule
  ],
  providers: [
    {
      provide: DateAdapter,
      useFactory: adapterFactory,
    },
    CalendarUtils,
    CalendarA11y,
    CalendarDateFormatter
  ],
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanningComponent {
  private destroyRef = inject(DestroyRef);
  private bookingRepo = inject<IBookingRepository>(BOOKING_REPOSITORY);
  private authService = inject(AuthService);
  private transloco = inject(TranslocoService);

  // State
  viewDate = signal(new Date());
  view = signal<CalendarView>(CalendarView.Week);
  bookings = signal<Booking[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Computed
  events = computed<CalendarEvent[]>(() => {
    return this.bookings().map(booking => ({
      id: booking.id,
      start: new Date(booking.startDate),
      end: new Date(booking.endDate),
      title: this.getBookingTitle(booking),
      color: this.getBookingColor(booking.status),
      meta: { booking }
    }));
  });

  private readonly localeMap = {
    fr: { code: 'fr', locale: fr },
    es: { code: 'es', locale: es },
    it: { code: 'it', locale: it },
    en: { code: 'en', locale: enUS }
  } as const;

  private currentLocale = computed(() => {
    const lang = this.transloco.getActiveLang();
    return this.localeMap[lang as keyof typeof this.localeMap] || this.localeMap.en;
  });

  locale = computed(() => this.currentLocale().code);
  dateFnsLocale = computed(() => this.currentLocale().locale);

  // View enum for template
  CalendarView = CalendarView;

  constructor() {
    this.loadBookings();
  }

  private loadBookings(): void {
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
  }

  private getBookingTitle(booking: Booking): string {
    // TODO: récupérer le nom du client/service depuis les stores
    return `Garde #${booking.id.slice(0, 8)}`;
  }

  private getBookingColor(status: Booking['status']): { primary: string; secondary: string } {
    const colors = {
      pending: { primary: '#fbbf24', secondary: '#fef3c7' },
      confirmed: { primary: '#3b82f6', secondary: '#dbeafe' },
      'in-progress': { primary: '#8b5cf6', secondary: '#ede9fe' },
      completed: { primary: '#10b981', secondary: '#d1fae5' },
      cancelled: { primary: '#ef4444', secondary: '#fee2e2' }
    };
    return colors[status] || colors.pending;
  }

  protected onEventClick(event: CalendarEvent): void {
    const booking = event.meta?.booking as Booking;
    if (booking) {
      console.log('Booking clicked:', booking);
      // TODO: ouvrir dialog avec détails de la garde
    }
  }

  protected setView(view: CalendarView): void {
    this.view.set(view);
  }

  protected previousPeriod(): void {
    const currentView = this.view();
    const currentDate = new Date(this.viewDate());

    if (currentView === CalendarView.Month) {
      this.viewDate.set(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (currentView === CalendarView.Week) {
      currentDate.setDate(currentDate.getDate() - 7);
      this.viewDate.set(currentDate);
    } else if (currentView === CalendarView.Day) {
      currentDate.setDate(currentDate.getDate() - 1);
      this.viewDate.set(currentDate);
    }
  }

  protected nextPeriod(): void {
    const currentView = this.view();
    const currentDate = new Date(this.viewDate());

    if (currentView === CalendarView.Month) {
      this.viewDate.set(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (currentView === CalendarView.Week) {
      currentDate.setDate(currentDate.getDate() + 7);
      this.viewDate.set(currentDate);
    } else if (currentView === CalendarView.Day) {
      currentDate.setDate(currentDate.getDate() + 1);
      this.viewDate.set(currentDate);
    }
  }

  protected today(): void {
    this.viewDate.set(new Date());
  }

  protected getPeriodLabel(): string {
    const date = this.viewDate();
    const currentView = this.view();
    const dateLocale = this.dateFnsLocale();

    if (currentView === CalendarView.Month) {
      return format(date, 'MMMM yyyy', { locale: dateLocale });
    } else if (currentView === CalendarView.Week) {
      const start = startOfWeek(date, { locale: dateLocale });
      const end = endOfWeek(date, { locale: dateLocale });
      return `${format(start, 'd MMM', { locale: dateLocale })} - ${format(end, 'd MMM yyyy', { locale: dateLocale })}`;
    } else {
      return format(date, 'EEEE d MMMM yyyy', { locale: dateLocale });
    }
  }
}
