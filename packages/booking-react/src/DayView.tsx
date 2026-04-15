import React from 'react';
import { parseDate } from '@widgetkit/booking';
import type { AvailabilityDay } from '@widgetkit/booking';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Props {
  date: string; // 'YYYY-MM-DD'
  day: AvailabilityDay | undefined;
  selectedTime: string | null;
  onTimeSelect: (time: string, duration: number) => void;
  onBack?: () => void; // shown in month-day mode
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function formatDateLabel(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()}. ${MONTH_NAMES[d.getMonth()]}`;
}

export function DayView({ date, day, selectedTime, onTimeSelect, onBack }: Props) {
  const slots = day?.slots ?? [];
  const hasSlots = slots.length > 0;

  return (
    <div className="bk-day">
      <div className="bk-day-header">
        {onBack && (
          <button className="bk-back-btn" onClick={onBack} aria-label="Back to calendar">
            &#8249;
          </button>
        )}
        <span className="bk-day-title">{formatDateLabel(date)}</span>
      </div>

      {!hasSlots && (
        <div className="bk-day-empty-msg">No available times</div>
      )}

      <div className="bk-slots">
        {slots.map(slot => {
          const disabled = !slot.available;
          const selected = slot.time === selectedTime;
          let cls = 'bk-slot';
          if (disabled) cls += ' bk-slot-disabled';
          else cls += ' bk-slot-available';
          if (selected) cls += ' bk-slot-selected';

          return (
            <button
              key={slot.time}
              className={cls}
              disabled={disabled}
              onClick={() => onTimeSelect(slot.time, slot.duration ?? 0)}
              aria-pressed={selected}
            >
              <span className="bk-slot-time">{slot.time}</span>
              {slot.duration != null && (
                <span className="bk-slot-duration">{formatDuration(slot.duration)}</span>
              )}
              {slot.price != null && (
                <span className="bk-slot-price">{slot.price}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
