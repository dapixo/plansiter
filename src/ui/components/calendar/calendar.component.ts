import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, input, output, signal, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, inject, DestroyRef } from '@angular/core';
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

export interface TimelineBar {
  id: string;
  startDate: Date;
  endDate: Date;
  title: string;
  status: string;
  clientName?: string;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [DatePipe, NgClass, ButtonModule, TranslocoModule, ActionButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header avec navigation -->
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 class="text-2xl font-bold">
          <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {{ ('calendar.months.' + currentMonthDisplay().monthKey) | transloco }} {{ currentMonthDisplay().year }}
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
            class="!p-2"
          ></button>
          <button
            pButton
            type="button"
            [label]="'calendar.today' | transloco"
            severity="secondary"
            [outlined]="true"
            (click)="toCurrentMonth()"
            [attr.aria-label]="'calendar.today' | transloco"
          ></button>
          <button
            pButton
            type="button"
            icon="pi pi-chevron-right"
            severity="secondary"
            [outlined]="true"
            (click)="nextMonth()"
            [attr.aria-label]="'calendar.nextMonth' | transloco"
            class="!p-2"
          ></button>
          <app-action-button
            labelKey="booking.form.create"
            ariaLabelKey="booking.form.create"
            icon="pi pi-plus"
            variant="primary"
            (click)="addBooking.emit()"
          ></app-action-button>
        </div>
      </div>

      <!-- Grille du calendrier -->
      <div class="flex flex-col gap-4">
        <!-- En-têtes des jours -->
        <div class="grid grid-cols-7 gap-1 text-center text-xs font-semibold leading-6 text-gray-600">
          @for (item of daysMetadata(); track item.dayKey) {
          <div
            [class.text-indigo-600]="item.isToday"
            [class.font-bold]="item.isToday"
          >
            {{ ('calendar.days.' + item.dayKey) | transloco }}
          </div>
          }
        </div>

        <!-- Grille du calendrier (conteneur pour positionnement absolu des barres) -->
        <div class="relative">
          <div class="grid grid-cols-7 auto-rows-max" #calendarGrid>
            @for (day of daysEnriched(); track getMarkerMapKey(day.day)) {
            <div
              class="flex h-24 md:h-28 w-full flex-col rounded-lg border-2 transition-all relative"
              [ngClass]="day.borderClass + ' ' + day.bgClass + ' ' + day.hoverClass"
            >
              <!-- Numéro du jour (en bas à droite) -->
              <div
                class="absolute bottom-1 right-1"
              >
                <div
                  class="flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold"
                  [class.bg-indigo-600]="day.isToday && day.isCurrentMonth"
                  [class.text-white]="day.isToday && day.isCurrentMonth"
                  [class.text-gray-400]="!day.isCurrentMonth"
                  [class.text-gray-600]="!day.isToday && day.isCurrentMonth"
                >
                  {{ day.day | date: 'd' }}
                </div>
              </div>
            </div>
            }
          </div>

          <!-- Barres positionnées absolument -->
          <div class="absolute inset-0 pointer-events-none">
            @for (bar of timelineBars(); track bar.id) {
              @for (barSegment of getBarSegments(bar); track barSegment.segmentId) {
                <div
                  class="absolute h-5 px-1.5 py-0 text-xs font-semibold flex items-center gap-1 truncate cursor-pointer transition-all hover:shadow-md pointer-events-auto border-l-4"
                  [style.top.px]="barSegment.top"
                  [style.left.px]="barSegment.left"
                  [style.width.px]="barSegment.width"
                  [class.rounded-l-lg]="barSegment.isStart"
                  [class.rounded-r-lg]="barSegment.isEnd"
                  [class.bg-indigo-100]="bar.status === 'pending'"
                  [class.border-l-indigo-400]="bar.status === 'pending'"
                  [class.text-indigo-700]="bar.status === 'pending'"
                  [class.bg-green-100]="bar.status === 'in-progress'"
                  [class.border-l-green-500]="bar.status === 'in-progress'"
                  [class.text-green-700]="bar.status === 'in-progress'"
                  [class.bg-gray-200]="bar.status === 'completed'"
                  [class.border-l-gray-400]="bar.status === 'completed'"
                  [class.text-gray-700]="bar.status === 'completed'"
                  [class.bg-red-100]="bar.status === 'cancelled'"
                  [class.border-l-red-400]="bar.status === 'cancelled'"
                  [class.text-red-700]="bar.status === 'cancelled'"
                >
                  @if (barSegment.isStart) {
                    <span class="truncate text-xs leading-none">{{ bar.title }}</span>
                  }
                  @if (barSegment.isEnd) {
                    <span class="text-xs ml-auto">✓</span>
                  }
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CalendarComponent implements AfterViewInit {
  // Services
  private readonly destroyRef = inject(DestroyRef);

  // Template references
  @ViewChild('calendarGrid') calendarGrid?: ElementRef<HTMLDivElement>;

  // Inputs
  readonly timelineBars = input<TimelineBar[]>([]);

  // Outputs
  readonly monthChange = output<Date>();
  readonly addBooking = output<void>();

  // Constants
  private readonly CELLS_PER_ROW = 7;
  private readonly BAR_HEIGHT = 20; // h-5 = 1.25rem = 20px
  private readonly BAR_GAP = 2; // Espace entre les barres
  private readonly BAR_TOP_OFFSET = 4; // Espace du haut de la cellule
  private readonly DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // State
  private readonly currentDate = signal(startOfToday());

  // Month display data (not translated in computed, will be translated in template)
  protected readonly currentMonthDisplay = computed(() => {
    const date = this.currentDate();
    const monthKey = format(date, 'MMMM').toLowerCase();
    const year = format(date, 'yyyy');
    return { monthKey, year };
  });

  // Layout measurements (updated from DOM)
  private readonly cellWidth = signal(0);
  private readonly cellHeight = signal(0);

  // Computed dates
  private readonly startDateOfSelectedMonth = computed(() => startOfMonth(this.currentDate()));
  private readonly endDateOfSelectedMonth = computed(() => endOfMonth(this.currentDate()));

  // Début de la grille (dimanche précédent le 1er du mois si nécessaire)
  private readonly gridStartDate = computed(() => {
    const start = this.startDateOfSelectedMonth();
    const dayOfWeek = start.getDay(); // 0 = Sunday, 6 = Saturday
    return subDays(start, dayOfWeek);
  });

  // Fin de la grille (samedi après le dernier jour du mois si nécessaire)
  private readonly gridEndDate = computed(() => {
    const end = this.endDateOfSelectedMonth();
    const dayOfWeek = end.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToAdd = 6 - dayOfWeek; // Ajouter des jours pour atteindre samedi
    return addDays(end, daysToAdd);
  });

  private readonly days = computed(() =>
    eachDayOfInterval({
      start: this.gridStartDate(),
      end: this.gridEndDate(),
    })
  );

  /**
   * Map qui track l'index (position dans la file) de chaque barre par jour
   * Structure: { "barId-dayIndex": index }
   *
   * Système de file dynamique :
   * - Chaque jour a sa propre file
   * - Une barre prend le premier créneau disponible le jour de son démarrage
   * - Une barre qui continue garde sa position tant qu'elle est active
   * - Quand une barre se termine, son créneau est libéré pour les barres suivantes
   */
  private readonly barIndexByDay = computed(() => {
    const indexMap = new Map<string, number>();
    const gridStart = this.gridStartDate();
    const gridEnd = this.gridEndDate();
    const barAssignedIndex = new Map<string, number>(); // barId -> index assigné

    // Calculer le nombre total de jours
    const totalDays = Math.floor(
      (gridEnd.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Pour chaque jour
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const currentDay = new Date(gridStart);
      currentDay.setDate(currentDay.getDate() + dayIndex);
      const normalizedCurrentDay = this.normalizeDate(currentDay);

      // Trouver toutes les barres actives ce jour
      const activeBars = this.timelineBars()
        .filter((bar) => {
          const barStart = this.normalizeDate(new Date(bar.startDate));
          const barEnd = this.normalizeDate(new Date(bar.endDate));
          return normalizedCurrentDay >= barStart && normalizedCurrentDay <= barEnd;
        })
        .sort((a, b) => {
          // Trier par date de départ, puis par ID pour déterminisme
          const aStart = this.normalizeDate(new Date(a.startDate));
          const bStart = this.normalizeDate(new Date(b.startDate));

          if (aStart.getTime() !== bStart.getTime()) {
            return aStart.getTime() - bStart.getTime();
          }
          return a.id.localeCompare(b.id);
        });

      // Assigner les indices pour ce jour
      const usedIndices = new Set<number>();

      activeBars.forEach((bar) => {
        let assignedIndex = barAssignedIndex.get(bar.id);

        // Si cette barre a déjà un index assigné, le réutiliser
        if (assignedIndex !== undefined) {
          usedIndices.add(assignedIndex);
        } else {
          // Sinon, trouver le premier créneau disponible
          let index = 0;
          while (usedIndices.has(index)) {
            index++;
          }
          assignedIndex = index;
          barAssignedIndex.set(bar.id, assignedIndex);
          usedIndices.add(assignedIndex);
        }

        indexMap.set(`${bar.id}-${dayIndex}`, assignedIndex);
      });
    }

    return indexMap;
  });

  // Day names with metadata (not translated in computed, will be translated in template)
  protected readonly daysMetadata = computed(() => {
    const today = format(startOfToday(), 'EEEE').toLowerCase();
    return this.DAY_KEYS.map((dayKey) => ({
      dayKey,
      isToday: dayKey === today,
    }));
  });

  // Enriched days with metadata and computed CSS classes
  protected readonly daysEnriched = computed(() => {
    const startMonth = this.startDateOfSelectedMonth();
    const endMonth = this.endDateOfSelectedMonth();

    return this.days().map((day) => {
      const isToday = isEqual(day, startOfToday());
      const isCurrentMonth = day >= startMonth && day <= endMonth;

      return {
        day,
        isToday,
        isCurrentMonth,
        borderClass: isCurrentMonth && isToday ? 'border-indigo-300' : 'border-gray-100',
        bgClass: isCurrentMonth ? 'bg-white' : 'bg-gray-50',
        hoverClass: isCurrentMonth ? 'hover:border-indigo-200 hover:shadow-sm' : '',
      };
    });
  });

  // Utility method to normalize dates (remove time component)
  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  // Methods
  protected nextMonth(): void {
    this.currentDate.set(addMonths(this.currentDate(), 1));
    this.monthChange.emit(this.currentDate());
  }

  protected prevMonth(): void {
    this.currentDate.set(subMonths(this.currentDate(), 1));
    this.monthChange.emit(this.currentDate());
  }

  protected toCurrentMonth(): void {
    this.currentDate.set(startOfToday());
    this.monthChange.emit(this.currentDate());
  }

  /**
   * Calcule les segments de barre avec positionnement absolu
   * Une barre peut être divisée en plusieurs segments si elle passe à la ligne
   * Les barres sont empilées verticalement si plusieurs sont présentes dans une semaine
   */
  protected getBarSegments(bar: TimelineBar): Array<{
    segmentId: string;
    top: number;
    left: number;
    width: number;
    isStart: boolean;
    isEnd: boolean;
  }> {
    const segments: Array<{
      segmentId: string;
      top: number;
      left: number;
      width: number;
      isStart: boolean;
      isEnd: boolean;
    }> = [];

    const gridStart = this.gridStartDate();
    const gridEnd = this.gridEndDate();

    // Normaliser les heures
    const barStart = this.normalizeDate(new Date(bar.startDate));
    const barEnd = this.normalizeDate(new Date(bar.endDate));

    // Délimiter la barre à la grille actuelle
    const displayStart = barStart > gridStart ? barStart : gridStart;
    const displayEnd = barEnd < gridEnd ? barEnd : gridEnd;

    // Paramètres de layout (en pixels)
    // Note: pas de gap dans la grille, donc les calculs sont simples
    const CELL_WIDTH = this.cellWidth() || 100; // Utiliser la vraie largeur mesurée
    const CELL_HEIGHT = this.cellHeight() || 104; // Utiliser la vraie hauteur mesurée

    // Calculer la position du premier jour de la barre
    const startDayIndex = Math.floor(
      (displayStart.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const startWeek = Math.floor(startDayIndex / this.CELLS_PER_ROW);
    const startDayInWeek = startDayIndex % this.CELLS_PER_ROW;

    // Calculer la position du dernier jour
    const endDayIndex = Math.floor(
      (displayEnd.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const endWeek = Math.floor(endDayIndex / this.CELLS_PER_ROW);
    const endDayInWeek = endDayIndex % this.CELLS_PER_ROW;

    // Créer des segments pour chaque ligne (week) que la barre traverse
    for (let week = startWeek; week <= endWeek; week++) {
      const isFirstWeek = week === startWeek;
      const isLastWeek = week === endWeek;

      const firstDayInSegment = isFirstWeek ? startDayInWeek : 0;
      const lastDayInSegment = isLastWeek ? endDayInWeek : this.CELLS_PER_ROW - 1;
      const daysInSegment = lastDayInSegment - firstDayInSegment + 1;

      // Calculer left : position horizontale du premier jour du segment
      const left = firstDayInSegment * CELL_WIDTH;

      // Calculer width : largeur du segment
      const width = daysInSegment * CELL_WIDTH;

      // Calculer top : position verticale (ligne du calendrier) + offset pour stacking
      // Utiliser l'index dynamique de la barre pour le premier jour de ce segment de semaine
      let segmentStartDayIndex = startDayIndex;
      if (!isFirstWeek) {
        // Pour les semaines suivantes, le segment commence le dimanche de cette semaine
        segmentStartDayIndex = week * this.CELLS_PER_ROW;
      }
      const dynamicBarIndex = this.barIndexByDay().get(`${bar.id}-${segmentStartDayIndex}`) || 0;
      const top =
        week * CELL_HEIGHT +
        this.BAR_TOP_OFFSET +
        dynamicBarIndex * (this.BAR_HEIGHT + this.BAR_GAP);

      segments.push({
        segmentId: `${bar.id}-week${week}`,
        top,
        left,
        width,
        isStart: isFirstWeek,
        isEnd: isLastWeek,
      });
    }

    return segments;
  }

  ngAfterViewInit(): void {
    // Mesurer les dimensions réelles des cellules
    this.measureCells();

    // Remesurer quand la fenêtre se redimensionne
    const resizeListener = () => this.measureCells();
    window.addEventListener('resize', resizeListener);

    // Observer les changements de taille du conteneur du calendrier (ex: fermeture de sidebar)
    // ResizeObserver capture tous les changements de layout, pas seulement window.resize
    if (this.calendarGrid?.nativeElement) {
      const resizeObserver = new ResizeObserver(() => this.measureCells());
      resizeObserver.observe(this.calendarGrid.nativeElement);

      // Cleanup: arrêter d'observer et enlever le listener quand le composant est détruit
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('resize', resizeListener);
        resizeObserver.disconnect();
      });
    } else {
      // Cleanup fallback si pas de calendarGrid
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

  getMarkerMapKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }
}
