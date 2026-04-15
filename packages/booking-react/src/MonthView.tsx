import React from 'react';
import { buildMonthGrid, parseDate } from '@widgetkit/booking';
import type { AvailabilityDay } from '@widgetkit/booking';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Props {
  year: number;
  month: number; // 0-indexed
  availability: AvailabilityDay[];
  selectedDate: string | null;
  minDate?: Date;
  maxDate?: Date;
  onMonthChange: (year: number, month: number) => void;
  onDateSelect: (date: string) => void;
}

export function MonthView({
  year, month, availability, selectedDate, minDate, maxDate,
  onMonthChange, onDateSelect,
}: Props) {
  const weeks = buildMonthGrid(year, month);
  const dayMap = new Map(availability.map(d => [d.date, d]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function prevMonth() {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  }

  function nextMonth() {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  }

  function isDisabled(date: string): boolean {
    const d = parseDate(date);
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    const day = dayMap.get(date);
    return !day || !day.available;
  }

  return (
    <div className="bk-month">
      <div className="bk-month-nav">
        <button className="bk-nav-btn" onClick={prevMonth} aria-label="Previous month">&#8249;</button>
        <span className="bk-month-title">{MONTH_NAMES[month]} {year}</span>
        <button className="bk-nav-btn" onClick={nextMonth} aria-label="Next month">&#8250;</button>
      </div>

      <div className="bk-month-grid">
        {DAY_LABELS.map(d => (
          <div key={d} className="bk-day-label">{d}</div>
        ))}

        {weeks.flat().map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="bk-day-cell bk-day-empty" />;

          const day = dayMap.get(date);
          const disabled = isDisabled(date);
          const selected = date === selectedDate;
          const dayNum = parseDate(date).getDate();
          const isToday = parseDate(date).getTime() === today.getTime();

          let cls = 'bk-day-cell';
          if (disabled) cls += ' bk-day-disabled';
          else cls += ' bk-day-available';
          if (selected) cls += ' bk-day-selected';
          if (isToday) cls += ' bk-day-today';

          return (
            <button
              key={date}
              className={cls}
              disabled={disabled}
              onClick={() => onDateSelect(date)}
              aria-label={date}
              aria-pressed={selected}
            >
              <span className="bk-day-num">{dayNum}</span>
              {day?.price != null && (
                <span className="bk-day-price">{day.price}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
