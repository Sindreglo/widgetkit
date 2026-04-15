import type { AvailabilitySlot, TimeWindow } from './types';

/** Parse 'HH:mm' into total minutes since midnight */
export function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Format total minutes since midnight to 'HH:mm' */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generate time slots from availability windows.
 * Each slot starts within a window and has room for a full `duration`.
 */
export function generateSlots(
  windows: TimeWindow[],
  duration: number,
  interval: number = duration,
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  for (const window of windows) {
    const from = parseTime(window.from);
    const to = parseTime(window.to);
    for (let t = from; t + duration <= to; t += interval) {
      slots.push({ time: formatTime(t), available: true });
    }
  }
  return slots;
}

/** Build a calendar grid for a given month.
 *  Returns weeks as arrays of 7 days (Mon–Sun).
 *  Days outside the month have date === null. */
export function buildMonthGrid(year: number, month: number): (string | null)[][] {
  // month is 0-indexed (same as Date)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday-first: 0=Mon … 6=Sun
  const startDow = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const cells: (string | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => {
      const d = i + 1;
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }),
  ];

  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

/** Format 'YYYY-MM-DD' → Date (local, no timezone shift) */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Format Date → 'YYYY-MM-DD' */
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
