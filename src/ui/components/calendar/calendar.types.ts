/**
 * Types et interfaces pour le composant Calendar
 */

export interface TimelineBar {
  id: string;
  startDate: Date;
  endDate: Date;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  clientName?: string;
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
