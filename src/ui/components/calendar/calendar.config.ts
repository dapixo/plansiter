import { BarStatusClasses } from './calendar.types';

/**
 * Configuration et constantes du calendrier
 */

export const CALENDAR_CONSTANTS = {
  CELLS_PER_ROW: 7,
  BAR_HEIGHT: 20, // h-5 = 1.25rem = 20px
  BAR_GAP: 2,
  BAR_TOP_OFFSET: 29,
  DAY_KEYS: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
} as const;

/**
 * Classes CSS pour chaque statut de barre
 */
export const BAR_STATUS_CLASSES: Record<string, BarStatusClasses> = {
  pending: {
    bg: 'bg-indigo-100',
    border: 'border-l-indigo-400',
    text: 'text-indigo-700'
  },
  'in-progress': {
    bg: 'bg-green-100',
    border: 'border-l-green-500',
    text: 'text-green-700'
  },
  completed: {
    bg: 'bg-gray-200',
    border: 'border-l-gray-400',
    text: 'text-gray-700'
  },
  cancelled: {
    bg: 'bg-red-100',
    border: 'border-l-red-400',
    text: 'text-red-700'
  }
} as const;
