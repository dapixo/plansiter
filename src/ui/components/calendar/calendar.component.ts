import { DatePipe, NgClass } from '@angular/common';
import {
  Component,
  computed,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  inject,
  DestroyRef,
  Renderer2,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TranslocoModule } from '@jsverse/transloco';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isEqual,
  startOfMonth,
  startOfToday,
  subMonths,
  subDays,
  addDays,
} from 'date-fns';

import {
  BarSegment,
  DayMetadata,
  EnrichedDay,
  TimelineBar,
} from './calendar.types';
import { CALENDAR_CONSTANTS, BAR_STATUS_CLASSES } from './calendar.config';
import { getDateKey, calculateBarSegments, calculateBarIndexMap } from './calendar.utils';
import { Popover } from 'primeng/popover';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [DatePipe, NgClass, ButtonModule, TranslocoModule, Popover],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host ::ng-deep [data-bar-id].highlighted {
        @apply shadow-md;
      }
      :host ::ng-deep .p-popover {
        @apply rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-w-md;
      }
      :host ::ng-deep .p-popover-content {
        @apply p-0;
      }
    `,
  ],
  templateUrl: './calendar.component.html',
})
export class CalendarComponent implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);

  @ViewChild('calendarGrid') calendarGrid?: ElementRef<HTMLDivElement>;
  @ViewChild('op') op!: Popover;

  readonly bookings = input<TimelineBar[]>([]);

  readonly monthChange = output<Date>();
  readonly addBooking = output<void>();
  readonly barClicked = output<{ bar: TimelineBar; event: MouseEvent }>();

  private readonly currentDate = signal(startOfToday());
  private readonly cellWidth = signal(0);
  private readonly cellHeight = signal(0);
  private readonly highlightedElements = signal<Element[]>([]);

  protected readonly currentMonthDisplay = computed(() => {
    const date = this.currentDate();
    return {
      monthKey: format(date, 'MMMM').toLowerCase(),
      year: format(date, 'yyyy'),
    };
  });

  private readonly startDateOfSelectedMonth = computed(() => startOfMonth(this.currentDate()));
  private readonly endDateOfSelectedMonth = computed(() => endOfMonth(this.currentDate()));

  private readonly gridStartDate = computed(() => {
    const start = this.startDateOfSelectedMonth();
    const dayOfWeek = start.getDay();
    return subDays(start, dayOfWeek);
  });

  private readonly gridEndDate = computed(() => {
    const end = this.endDateOfSelectedMonth();
    const dayOfWeek = end.getDay();
    return addDays(end, 6 - dayOfWeek);
  });

  private readonly days = computed(() =>
    eachDayOfInterval({
      start: this.gridStartDate(),
      end: this.gridEndDate(),
    })
  );

  private readonly barIndexByDay = computed(() =>
    calculateBarIndexMap(this.bookings(), this.gridStartDate(), this.gridEndDate())
  );

  protected readonly daysMetadata = computed((): DayMetadata[] => {
    const today = format(startOfToday(), 'EEEE').toLowerCase();
    return CALENDAR_CONSTANTS.DAY_KEYS.map((dayKey) => ({
      dayKey,
      isToday: dayKey === today,
    }));
  });

  protected readonly daysEnriched = computed((): EnrichedDay[] => {
    const startMonth = this.startDateOfSelectedMonth();
    const endMonth = this.endDateOfSelectedMonth();

    return this.days().map((day) => {
      const isToday = isEqual(day, startOfToday());
      const isCurrentMonth = day >= startMonth && day <= endMonth;

      return {
        day,
        isToday,
        isCurrentMonth,
        borderClass: 'border-gray-100',
        bgClass: isCurrentMonth ? 'bg-white' : 'bg-gray-50',
      };
    });
  });

  selectedBar: null | TimelineBar = null;

  protected nextMonth(): void {
    this.currentDate.update((date) => addMonths(date, 1));
    this.monthChange.emit(this.currentDate());
  }

  protected prevMonth(): void {
    this.currentDate.update((date) => subMonths(date, 1));
    this.monthChange.emit(this.currentDate());
  }

  protected toCurrentMonth(): void {
    this.currentDate.set(startOfToday());
    this.monthChange.emit(this.currentDate());
  }

  protected getDateKey(date: Date): string {
    return getDateKey(date);
  }

  protected getBarClasses(status: string): string {
    const classes = BAR_STATUS_CLASSES[status] || BAR_STATUS_CLASSES['pending'];
    return `${classes.bg} ${classes.border} ${classes.text}`;
  }

  protected getBarSegments(bar: TimelineBar): BarSegment[] {
    return calculateBarSegments(
      bar,
      this.gridStartDate(),
      this.gridEndDate(),
      this.cellWidth() || 100,
      this.cellHeight() || 104,
      this.barIndexByDay()
    );
  }

  protected highlightBar(barId: string): void {
    const elements = Array.from(document.querySelectorAll(`[data-bar-id="${barId}"]`));
    elements.forEach((el) => this.renderer.addClass(el, 'highlighted'));
    this.highlightedElements.set(elements);
  }

  protected unhighlightBar(): void {
    this.highlightedElements().forEach((el) => this.renderer.removeClass(el, 'highlighted'));
    this.highlightedElements.set([]);
  }

  ngAfterViewInit(): void {
    this.measureCells();
    this.setupResizeObservers();
  }

  private setupResizeObservers(): void {
    const resizeListener = () => this.measureCells();
    window.addEventListener('resize', resizeListener);

    if (this.calendarGrid?.nativeElement) {
      const resizeObserver = new ResizeObserver(() => this.measureCells());
      resizeObserver.observe(this.calendarGrid.nativeElement);

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('resize', resizeListener);
        resizeObserver.disconnect();
      });
    } else {
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('resize', resizeListener);
      });
    }
  }

  private measureCells(): void {
    if (!this.calendarGrid?.nativeElement) return;

    const firstCell = this.calendarGrid.nativeElement.querySelector('div');
    if (!firstCell) return;

    const rect = firstCell.getBoundingClientRect();
    this.cellWidth.set(rect.width);
    this.cellHeight.set(rect.height);
  }

  protected displayProduct(event: MouseEvent, bar: TimelineBar) {
    if (this.selectedBar?.id === bar.id) {
      this.op.hide();
      this.selectedBar = null;
    } else {
      this.selectedBar = bar;
      this.barClicked.emit({ bar, event });
      this.op.show(event);

      if (this.op.container) {
        this.op.align();
      }
    }
  }
}
