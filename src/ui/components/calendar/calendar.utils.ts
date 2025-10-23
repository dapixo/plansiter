import { format } from 'date-fns';
import { BarSegment, TimelineBar } from './calendar.types';
import { CALENDAR_CONSTANTS } from './calendar.config';

/**
 * Fonctions utilitaires pures pour le calendrier
 */

/**
 * Normalise une date en enlevant la composante temps
 */
export function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Génère une clé unique pour une date (format yyyy-MM-dd)
 */
export function getDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Calcule le nombre de jours entre deux dates
 */
export function daysBetween(start: Date, end: Date): number {
  return Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
}

/**
 * Calcule les segments de barre avec positionnement absolu
 * Une barre peut être divisée en plusieurs segments si elle passe à la ligne
 */
export function calculateBarSegments(
  bar: TimelineBar,
  gridStart: Date,
  gridEnd: Date,
  cellWidth: number,
  cellHeight: number,
  barIndexMap: Map<string, number>
): BarSegment[] {
  const segments: BarSegment[] = [];

  const barStart = normalizeDate(new Date(bar.startDate));
  const barEnd = normalizeDate(new Date(bar.endDate));

  // Délimiter la barre à la grille actuelle
  const displayStart = barStart > gridStart ? barStart : gridStart;
  const displayEnd = barEnd < gridEnd ? barEnd : gridEnd;

  // Calculer la position du premier jour de la barre
  const startDayIndex = Math.floor(
    (displayStart.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const startWeek = Math.floor(startDayIndex / CALENDAR_CONSTANTS.CELLS_PER_ROW);
  const startDayInWeek = startDayIndex % CALENDAR_CONSTANTS.CELLS_PER_ROW;

  // Calculer la position du dernier jour
  const endDayIndex = Math.floor(
    (displayEnd.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const endWeek = Math.floor(endDayIndex / CALENDAR_CONSTANTS.CELLS_PER_ROW);
  const endDayInWeek = endDayIndex % CALENDAR_CONSTANTS.CELLS_PER_ROW;

  // Créer des segments pour chaque ligne (week) que la barre traverse
  for (let week = startWeek; week <= endWeek; week++) {
    const isFirstWeek = week === startWeek;
    const isLastWeek = week === endWeek;

    const firstDayInSegment = isFirstWeek ? startDayInWeek : 0;
    const lastDayInSegment = isLastWeek ? endDayInWeek : CALENDAR_CONSTANTS.CELLS_PER_ROW - 1;
    const daysInSegment = lastDayInSegment - firstDayInSegment + 1;

    // Calculer les positions
    const left = firstDayInSegment * cellWidth;
    const width = daysInSegment * cellWidth;

    // Calculer top avec l'index dynamique
    let segmentStartDayIndex = startDayIndex;
    if (!isFirstWeek) {
      segmentStartDayIndex = week * CALENDAR_CONSTANTS.CELLS_PER_ROW;
    }
    const dynamicBarIndex = barIndexMap.get(`${bar.id}-${segmentStartDayIndex}`) || 0;
    const top =
      week * cellHeight +
      CALENDAR_CONSTANTS.BAR_TOP_OFFSET +
      dynamicBarIndex * (CALENDAR_CONSTANTS.BAR_HEIGHT + CALENDAR_CONSTANTS.BAR_GAP);

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

/**
 * Calcule le map d'index des barres par jour
 * Système de file dynamique pour empiler les barres
 */
export function calculateBarIndexMap(
  timelineBars: TimelineBar[],
  gridStart: Date,
  gridEnd: Date
): Map<string, number> {
  const indexMap = new Map<string, number>();
  const barAssignedIndex = new Map<string, number>();

  const totalDays = daysBetween(gridStart, gridEnd);

  // Pour chaque jour
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const currentDay = new Date(gridStart);
    currentDay.setDate(currentDay.getDate() + dayIndex);
    const normalizedCurrentDay = normalizeDate(currentDay);

    // Trouver toutes les barres actives ce jour
    const activeBars = timelineBars
      .filter((bar) => {
        const barStart = normalizeDate(new Date(bar.startDate));
        const barEnd = normalizeDate(new Date(bar.endDate));
        return normalizedCurrentDay >= barStart && normalizedCurrentDay <= barEnd;
      })
      .sort((a, b) => {
        const aStart = normalizeDate(new Date(a.startDate));
        const bStart = normalizeDate(new Date(b.startDate));

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
}
