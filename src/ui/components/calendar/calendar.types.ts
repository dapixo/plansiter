/**
 * Types et interfaces pour le composant Calendar
 */
import { Booking, bookingStatus } from '@domain/entities';

/**
 * Barre de timeline - données minimales pour afficher un booking dans le calendrier
 */
export interface TimelineBar extends Booking {
  subjectName: string;
  status: bookingStatus;
}

/**
 * Données enrichies pour le popover de détail du booking
 * Juste les infos essentielles pour afficher le détail
 */
export interface BookingDetail extends Booking {
  status: bookingStatus;
  clientName: string;
  clientAddress: string;
  subjectName: string;
  serviceName: string;
}

export interface BarSegment {
  segmentId: string;
  top: number;
  left: number;
  width: number;
  isStart: boolean;
  isEnd: boolean;
}

export interface DayMetadata {
  dayKey: string;
  isToday: boolean;
}

export interface EnrichedDay {
  day: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  borderClass: string;
  bgClass: string;
}

export interface BarStatusClasses {
  bg: string;
  border: string;
  text: string;
}
