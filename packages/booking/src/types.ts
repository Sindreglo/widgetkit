export type BookingMode = 'month-day' | 'month-only' | 'day-only';

export interface AvailabilitySlot {
  time: string;            // 'HH:mm'
  available: boolean;
  duration?: number;       // minutes
  price?: number | string;
}

export interface AvailabilityDay {
  date: string;            // 'YYYY-MM-DD'
  available: boolean;
  price?: number | string;
  slots?: AvailabilitySlot[];
}

export interface BookingSelection {
  date: string;            // 'YYYY-MM-DD'
  time?: string;           // 'HH:mm' — absent in month-only mode
  duration: number;        // minutes
}

export interface TimeWindow {
  from: string;            // 'HH:mm'
  to: string;              // 'HH:mm'
}
