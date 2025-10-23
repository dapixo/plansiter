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
import { ActionButtonComponent } from '../action-button/action-button.component';
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
  TimelineBar,
  BarSegment,
  DayMetadata,
  EnrichedDay,
} from './calendar.types';
import { CALENDAR_CONSTANTS, BAR_STATUS_CLASSES } from './calendar.config';
import {
  getDateKey,
  calculateBarSegments,
  calculateBarIndexMap,
} from './calendar.utils';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [DatePipe, NgClass, ButtonModule, TranslocoModule, ActionButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host ::ng-deep [data-bar-id].highlighted {
        @apply shadow-md;
      }
    `,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header avec navigation -->
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 class="text-2xl font-bold">
          <span
            class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {{ ('calendar.months.' + currentMonthDisplay().monthKey) | transloco }}
            {{ currentMonthDisplay().year }}
          </span>
        </h2>

        <div class="flex gap-2 items-center">
          <button
            pButton
            type="button"
            icon="pi pi-chevron-left"
            severity="secondary"
            [outlined]="true"
            (click)="prevMonth()"
            [attr.aria-label]="'calendar.previousMonth' | transloco"
            class="!p-2"></button>
          <button
            pButton
            type="button"
            [label]="'calendar.today' | transloco"
            severity="secondary"
            [outlined]="true"
            (click)="toCurrentMonth()"
            [attr.aria-label]="'calendar.today' | transloco"></button>
          <button
            pButton
            type="button"
            icon="pi pi-chevron-right"
            severity="secondary"
            [outlined]="true"
            (click)="nextMonth()"
            [attr.aria-label]="'calendar.nextMonth' | transloco"
            class="!p-2"></button>
          <app-action-button
            labelKey="booking.form.create"
            ariaLabelKey="booking.form.create"
            icon="pi pi-plus"
            variant="primary"
            (click)="addBooking.emit()"></app-action-button>
        </div>
      </div>

      <!-- Grille du calendrier -->
      <div class="flex flex-col gap-4">
        <!-- En-têtes des jours -->
        <div
          class="grid grid-cols-7 gap-1 text-center text-xs font-semibold leading-6 text-gray-600">
          @for (item of daysMetadata(); track item.dayKey) {
          <div [class.text-indigo-600]="item.isToday" [class.font-bold]="item.isToday">
            {{ ('calendar.days.' + item.dayKey) | transloco }}
          </div>
          }
        </div>

        <!-- Grille du calendrier (conteneur pour positionnement absolu des barres) -->
        <div class="relative">
          <div class="grid grid-cols-7 auto-rows-max" #calendarGrid>
            @for (day of daysEnriched(); track getDateKey(day.day)) {
            <div
              class="flex h-32 md:h-40 w-full flex-col rounded-lg border-2 transition-all relative"
              [ngClass]="day.borderClass + ' ' + day.bgClass">
              <!-- Numéro du jour (en haut au milieu) -->
              <div class="absolute top-1 left-1/2 -translate-x-1/2">
                <div
                  class="flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold"
                  [class.bg-indigo-600]="day.isToday && day.isCurrentMonth"
                  [class.text-white]="day.isToday && day.isCurrentMonth"
                  [class.text-gray-400]="!day.isCurrentMonth"
                  [class.text-gray-600]="!day.isToday && day.isCurrentMonth">
                  {{ day.day | date: 'd' }}
                </div>
              </div>
            </div>
            }
          </div>

          <!-- Barres positionnées absolument -->
          <div class="absolute inset-0 pointer-events-none">
            @for (bar of timelineBars(); track bar.id) { @for (barSegment of getBarSegments(bar);
            track barSegment.segmentId) {
            <div
              class="absolute h-5 px-1.5 py-0 text-xs font-semibold flex items-center gap-1 truncate cursor-pointer transition-all pointer-events-auto border-l-4 group/bar"
              [attr.data-bar-id]="bar.id"
              [style.top.px]="barSegment.top"
              [style.left.px]="barSegment.left"
              [style.width.px]="barSegment.width"
              [class.rounded-l-lg]="barSegment.isStart"
              [class.rounded-r-lg]="barSegment.isEnd"
              [ngClass]="getBarClasses(bar.status)"
              (mouseenter)="highlightBar(bar.id)"
              (mouseleave)="unhighlightBar()">
              @if (barSegment.isStart) {
              <span class="truncate text-xs leading-none">{{ bar.title }}</span>
              } @if (barSegment.isEnd) {
              <span class="text-xs ml-auto">✓</span>
              }
            </div>
            } }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CalendarComponent implements AfterViewInit {
  // Services
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);

  // Template references
  @ViewChild('calendarGrid') calendarGrid?: ElementRef<HTMLDivElement>;

  // Inputs
  readonly timelineBars = input<TimelineBar[]>([]);

  // Outputs
  readonly monthChange = output<Date>();
  readonly addBooking = output<void>();

  // State
  private readonly currentDate = signal(startOfToday());
  private readonly cellWidth = signal(0);
  private readonly cellHeight = signal(0);
  private readonly highlightedElements = signal<Element[]>([]);

  // Computed: Month display data
  protected readonly currentMonthDisplay = computed(() => {
    const date = this.currentDate();
    return {
      monthKey: format(date, 'MMMM').toLowerCase(),
      year: format(date, 'yyyy'),
    };
  });

  // Computed: Dates
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

  // Computed: Bar index map (memoized via computed)
  private readonly barIndexByDay = computed(() =>
    calculateBarIndexMap(this.timelineBars(), this.gridStartDate(), this.gridEndDate())
  );

  // Computed: Day metadata
  protected readonly daysMetadata = computed((): DayMetadata[] => {
    const today = format(startOfToday(), 'EEEE').toLowerCase();
    return CALENDAR_CONSTANTS.DAY_KEYS.map((dayKey) => ({
      dayKey,
      isToday: dayKey === today,
    }));
  });

  // Computed: Enriched days
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

  // Navigation methods
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

  // Helper methods
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

  /**
   * Highlight tous les segments de la timeline avec l'ID donné
   * Utilise Renderer2 pour éviter la manipulation DOM directe
   */
  protected highlightBar(barId: string): void {
    const elements = Array.from(document.querySelectorAll(`[data-bar-id="${barId}"]`));
    elements.forEach((el) => this.renderer.addClass(el, 'highlighted'));
    this.highlightedElements.set(elements);
  }

  /**
   * Retire le highlight de tous les segments
   */
  protected unhighlightBar(): void {
    this.highlightedElements().forEach((el) => this.renderer.removeClass(el, 'highlighted'));
    this.highlightedElements.set([]);
  }

  // Lifecycle
  ngAfterViewInit(): void {
    this.measureCells();
    this.setupResizeObservers();
  }

  /**
   * Configure les observers pour les changements de taille
   */
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

  /**
   * Mesure les dimensions réelles des cellules du calendrier
   */
  private measureCells(): void {
    if (!this.calendarGrid?.nativeElement) return;

    const firstCell = this.calendarGrid.nativeElement.querySelector('div');
    if (!firstCell) return;

    const rect = firstCell.getBoundingClientRect();
    this.cellWidth.set(rect.width);
    this.cellHeight.set(rect.height);
  }
}
