import React, { useState } from 'react';
import { formatDate } from '@widgetkit/booking';
import type { AvailabilityDay, BookingMode, BookingSelection } from '@widgetkit/booking';
import { MonthView } from './MonthView';
import { DayView } from './DayView';

export interface BookingSchedulerProps {
  mode?: BookingMode;
  availability: AvailabilityDay[];

  // For day-only mode: which day to display
  date?: Date;

  // Month view start
  initialMonth?: Date;
  minDate?: Date;
  maxDate?: Date;

  // Display
  showPrice?: boolean;
  showDuration?: boolean;

  onSelect?: (selection: BookingSelection) => void;
}

export function BookingScheduler({
  mode = 'month-day',
  availability,
  date: dateProp,
  initialMonth,
  minDate,
  maxDate,
  showPrice = true,
  showDuration = true,
  onSelect,
}: BookingSchedulerProps) {
  const now = initialMonth ?? new Date();

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    mode === 'day-only' && dateProp ? formatDate(dateProp) : null,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const dayMap = new Map(availability.map(d => [d.date, d]));

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedTime(null);
    if (mode === 'month-only') {
      onSelect?.({ date, duration: 0 });
    }
  }

  function handleTimeSelect(time: string, duration: number) {
    setSelectedTime(time);
    if (selectedDate) {
      onSelect?.({ date: selectedDate, time, duration });
    }
  }

  function handleBack() {
    setSelectedDate(null);
    setSelectedTime(null);
  }

  const sideBySide = mode === 'month-day';
  const showDayView = mode === 'day-only' || sideBySide;
  const dayDate = mode === 'day-only' && dateProp ? formatDate(dateProp) : selectedDate;

  return (
    <div className={`bk-root${sideBySide ? ' bk-side-by-side' : ''}`}>
      <div className="bk-month-col">
        {(mode === 'month-only' || mode === 'month-day') && (
          <MonthView
            year={viewYear}
            month={viewMonth}
            availability={availability}
            selectedDate={selectedDate}
            minDate={minDate}
            maxDate={maxDate}
            showPrice={showPrice}
            onMonthChange={(y, m) => { setViewYear(y); setViewMonth(m); }}
            onDateSelect={handleDateSelect}
          />
        )}
      </div>

      {showDayView && dayDate && (
        <DayView
          date={dayDate}
          day={dayMap.get(dayDate)}
          selectedTime={selectedTime}
          showPrice={showPrice}
          showDuration={showDuration}
          onTimeSelect={handleTimeSelect}
          onBack={mode === 'month-day' ? handleBack : undefined}
        />
      )}
    </div>
  );
}
