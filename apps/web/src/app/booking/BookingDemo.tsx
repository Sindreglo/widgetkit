"use client";

import { useState } from "react";
import { BookingScheduler } from "@widgetkit/booking-react";
import "@widgetkit/booking-react/styles.css";
import type { AvailabilityDay, AvailabilitySlot, BookingMode, BookingSelection } from "@widgetkit/booking-react";

function makeAvailability(): AvailabilityDay[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = (n: number) => `${y}-${m}-${String(n).padStart(2, "0")}`;

  const morning: AvailabilitySlot[] = [
    { time: "09:00", available: true,  duration: 60, price: "€40" },
    { time: "10:00", available: true,  duration: 60, price: "€40" },
    { time: "11:00", available: false, duration: 60 },
  ];
  const afternoon: AvailabilitySlot[] = [
    { time: "13:00", available: true,  duration: 90, price: "€55" },
    { time: "14:30", available: true,  duration: 60, price: "€40" },
    { time: "16:00", available: false, duration: 60 },
  ];

  return [
    { date: d(3),  available: true,  price: "€40", slots: morning },
    { date: d(5),  available: true,  price: "€40", slots: [...morning, ...afternoon] },
    { date: d(7),  available: false },
    { date: d(10), available: true,  price: "€55", slots: afternoon },
    { date: d(12), available: true,  price: "€40", slots: morning },
    { date: d(14), available: false },
    { date: d(17), available: true,  price: "€40", slots: [...morning, ...afternoon] },
    { date: d(19), available: true,  price: "€55", slots: afternoon },
    { date: d(21), available: false },
    { date: d(24), available: true,  price: "€40", slots: morning },
    { date: d(26), available: true,  price: "€40", slots: [...morning, ...afternoon] },
    { date: d(28), available: true,  price: "€55", slots: afternoon },
  ];
}

const AVAILABILITY = makeAvailability();
const DAY_ONLY_DATE = new Date(
  AVAILABILITY.find((d) => d.available && d.slots?.length)?.date ?? new Date()
);

const MODES: { value: BookingMode; label: string }[] = [
  { value: "month-day",  label: "Month + Day" },
  { value: "month-only", label: "Month only" },
  { value: "day-only",   label: "Day only" },
];

export function BookingDemo() {
  const [mode, setMode]               = useState<BookingMode>("month-day");
  const [showPrice, setShowPrice]     = useState(true);
  const [showDuration, setShowDuration] = useState(true);
  const [selection, setSelection]     = useState<BookingSelection | null>(null);

  return (
    <div>
      <div className="demo-controls">
        <div className="demo-controls-group">
          <span className="demo-controls-group-label">Mode</span>
          <div className="demo-controls-row">
            {MODES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`demo-toggle-btn${mode === value ? " active" : ""}`}
                onClick={() => { setMode(value); setSelection(null); }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="demo-controls-group">
          <span className="demo-controls-group-label">Display</span>
          <div className="demo-controls-row">
            <button
              type="button"
              className={`demo-toggle-btn${showPrice ? " active" : ""}`}
              onClick={() => setShowPrice((p) => !p)}
            >
              Price
            </button>
            <button
              type="button"
              className={`demo-toggle-btn${showDuration ? " active" : ""}`}
              onClick={() => setShowDuration((d) => !d)}
            >
              Duration
            </button>
          </div>
        </div>
      </div>

      <div className="booking-demo">
        <BookingScheduler
          mode={mode}
          availability={AVAILABILITY}
          date={mode === "day-only" ? DAY_ONLY_DATE : undefined}
          showPrice={showPrice}
          showDuration={showDuration}
          onSelect={setSelection}
        />
      </div>

      {selection && (
        <div className="booking-selection">
          <span className="booking-selection-label">Selected:</span>
          <code className="inline-code">{selection.date}</code>
          {selection.time && (
            <>
              <code className="inline-code">{selection.time}</code>
              <span>· {selection.duration} min</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
