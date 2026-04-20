import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "./Sidebar";
import { BookingDemo } from "./BookingDemo";
import { GettingStartedSection } from "./GettingStartedSection";
import { PropsTable } from "./PropsTable";
import { CodeBlock } from "./CodeBlock";
import { BookingModeDemo } from "./BookingModeDemo";

export const metadata: Metadata = {
  title: "Booking — WidgetKit",
  description: "A date and time slot booking component with month calendar, day view, and flexible display modes.",
};

const MONTH_DAY_SNIPPET = `import { useState } from "react";
import { BookingScheduler } from "@widgetkit/booking-react";
import "@widgetkit/booking-react/styles.css";
import type { AvailabilityDay, BookingSelection } from "@widgetkit/booking-react";

// availability comes from your API
const availability: AvailabilityDay[] = [...];

export function App() {
  const [selection, setSelection] = useState<BookingSelection | null>(null);

  return (
    <BookingScheduler
      availability={availability}
      onSelect={setSelection}
    />
  );
}`;

const MONTH_DAY_VUE = `<script setup lang="ts">
import { ref } from "vue";
import { BookingScheduler } from "@widgetkit/booking-vue";
import "@widgetkit/booking-vue/styles.css";
import type { AvailabilityDay, BookingSelection } from "@widgetkit/booking-vue";

const availability: AvailabilityDay[] = [...];
const selection = ref<BookingSelection | null>(null);
<\/script>

<template>
  <BookingScheduler
    :availability="availability"
    @select="(s) => (selection = s)"
  />
</template>`;

const MONTH_ONLY_SNIPPET = `// Calendar-only — user picks a date, no time slot step
<BookingScheduler
  availability={availability}
  mode="month-only"
  onSelect={(s) => console.log("Date:", s.date)}
/>`;

const MONTH_ONLY_VUE = `<!-- Calendar-only — user picks a date, no time slot step -->
<BookingScheduler
  :availability="availability"
  mode="month-only"
  @select="(s) => console.log('Date:', s.date)"
/>`;

const DAY_ONLY_SNIPPET = `// Time slots only — pass date to control which day is shown
<BookingScheduler
  availability={availability}
  mode="day-only"
  date={new Date("2024-06-10")}
  onSelect={(s) => console.log("Slot:", s.time, "·", s.duration, "min")}
/>`;

const DAY_ONLY_VUE = `<!-- Time slots only — pass date to control which day is shown -->
<BookingScheduler
  :availability="availability"
  mode="day-only"
  :date="new Date('2024-06-10')"
  @select="(s) => console.log('Slot:', s.time, '·', s.duration, 'min')"
/>`;

const GENERATE_SLOTS_SNIPPET = `import { generateSlots } from "@widgetkit/booking-react";
// also available from "@widgetkit/booking-vue" or "@widgetkit/booking"

// Two availability windows: 09:00–12:00 and 13:00–17:00
// 60-minute slots, 30-minute intervals
const slots = generateSlots(
  [
    { from: "09:00", to: "12:00" },
    { from: "13:00", to: "17:00" },
  ],
  60,  // duration in minutes
  30,  // interval (optional — defaults to duration)
);

// Each slot starts within a window and its full duration fits before the window ends.
// [
//   { time: "09:00", available: true, duration: 60 },
//   { time: "09:30", available: true, duration: 60 },
//   { time: "10:00", available: true, duration: 60 },
//   { time: "10:30", available: true, duration: 60 },
//   { time: "11:00", available: true, duration: 60 },
//   { time: "13:00", available: true, duration: 60 },
//   ...
// ]`;

const TYPES_IMPORT = `import type {
  AvailabilityDay,
  AvailabilitySlot,
  BookingMode,
  BookingSelection,
  TimeWindow,
} from "@widgetkit/booking-react";`;

const TYPES_IMPORT_VUE = `import type {
  AvailabilityDay,
  AvailabilitySlot,
  BookingMode,
  BookingSelection,
  TimeWindow,
} from "@widgetkit/booking-vue";`;

const TYPES_SNIPPET = `type BookingMode = "month-day" | "month-only" | "day-only";

interface AvailabilitySlot {
  time:       string;           // "HH:mm"
  available:  boolean;
  duration?:  number;           // minutes
  price?:     number | string;
}

interface AvailabilityDay {
  date:      string;            // "YYYY-MM-DD"
  available: boolean;
  price?:    number | string;
  slots?:    AvailabilitySlot[];
}

// Returned by onSelect / emitted by @select
interface BookingSelection {
  date:     string;             // "YYYY-MM-DD" — always present
  time?:    string;             // "HH:mm" — absent in month-only mode
  duration: number;             // minutes
}

// Used with generateSlots()
interface TimeWindow {
  from: string;                 // "HH:mm"
  to:   string;                 // "HH:mm"
}`;

export default function BookingPage() {
  return (
    <>
      <nav className="nav">
        <a href="/" className="nav-logo">
          <span className="nav-logo-widget">Widget</span><span className="nav-logo-kit">Kit</span>
        </a>
        <ul className="nav-links">
          <li><a href="/#products">Products</a></li>
        </ul>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ThemeToggle />
          <a href="https://github.com/Sindreglo/widgetkit" target="_blank" rel="noopener noreferrer" className="theme-icon-btn" aria-label="GitHub">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
          </a>
          <a href="/#products" className="nav-cta">Explore widgets</a>
        </div>
      </nav>

      <div className="docs-layout">
        <Sidebar />

        <main className="docs-content">
          <div className="docs-page-header">
            <div className="docs-pkg-badges">
              <span className="docs-pkg-badge">@widgetkit/booking-react</span>
              <span className="docs-pkg-badge">@widgetkit/booking-vue</span>
            </div>
            <h1 className="docs-page-title">Booking</h1>
            <p className="docs-page-desc">
              A date and time slot picker with a month calendar view, day slots
              view, and three flexible layout modes. Pass your availability data
              and receive a typed selection — no state management required.
            </p>
          </div>

          <section id="introduction" className="docs-section">
            <p className="docs-section-tag">Overview</p>
            <h2>Introduction</h2>
            <p>
              <code className="inline-code">BookingScheduler</code> renders a
              calendar for date selection and a time slot list for hour picking.
              Switch between three modes — side-by-side, calendar only, or slots
              only — and toggle price and duration display with boolean props.
            </p>
            <BookingDemo />
          </section>

          <section id="installation" className="docs-section">
            <p className="docs-section-tag">Setup</p>
            <h2>Getting started</h2>
            <GettingStartedSection />
          </section>

          <section id="mode-month-day" className="docs-section">
            <p className="docs-section-tag">Example</p>
            <h2>Month + Day</h2>
            <p>
              The default mode. The calendar and time slot list are shown
              side by side — the user first picks a date, then a time slot.
              On narrow viewports they stack vertically.
            </p>
            <BookingModeDemo mode="month-day" />
            <CodeBlock code={MONTH_DAY_SNIPPET} vue={MONTH_DAY_VUE} />
          </section>

          <section id="mode-month-only" className="docs-section">
            <p className="docs-section-tag">Example</p>
            <h2>Month only</h2>
            <p>
              Shows the calendar without any time slot step. Useful for
              date-only bookings, event registrations, or when you handle
              time selection in a separate step.{" "}
              <code className="inline-code">onSelect</code> fires with{" "}
              <code className="inline-code">date</code> and{" "}
              <code className="inline-code">duration: 0</code> — no{" "}
              <code className="inline-code">time</code> field.
            </p>
            <BookingModeDemo mode="month-only" />
            <CodeBlock code={MONTH_ONLY_SNIPPET} vue={MONTH_ONLY_VUE} />
          </section>

          <section id="mode-day-only" className="docs-section">
            <p className="docs-section-tag">Example</p>
            <h2>Day only</h2>
            <p>
              Shows only the time slot list for a specific day. Use this when
              the date is already known — for example inside a calendar cell, a
              resource detail panel, or a multi-step flow where the date was
              chosen in a previous step. Control which day is shown via the{" "}
              <code className="inline-code">date</code> prop.
            </p>
            <BookingModeDemo mode="day-only" />
            <CodeBlock code={DAY_ONLY_SNIPPET} vue={DAY_ONLY_VUE} />
          </section>

          <section id="generate-slots" className="docs-section">
            <p className="docs-section-tag">Example</p>
            <h2>Generate slots</h2>
            <p>
              <code className="inline-code">generateSlots</code> is a utility
              exported from all three packages. Give it one or more time
              windows and a duration — it returns a list of{" "}
              <code className="inline-code">AvailabilitySlot</code> objects
              ready to drop into an{" "}
              <code className="inline-code">AvailabilityDay</code>. Use it
              server-side to build your availability array from your
              calendar or booking rules.
            </p>
            <CodeBlock code={GENERATE_SLOTS_SNIPPET} />
          </section>

          <section id="props" className="docs-section">
            <p className="docs-section-tag">Reference</p>
            <h2>Props</h2>
            <p>
              All props except{" "}
              <code className="inline-code">availability</code> are optional.
              Props marked <span className="prop-required">*</span> are required.
            </p>
            <PropsTable />
          </section>

          <section id="types" className="docs-section">
            <p className="docs-section-tag">Reference</p>
            <h2>TypeScript types</h2>
            <p>
              All types are exported from both{" "}
              <code className="inline-code">@widgetkit/booking-react</code> and{" "}
              <code className="inline-code">@widgetkit/booking-vue</code>. The{" "}
              <code className="inline-code">@widgetkit/booking</code> core package
              also exports them if you need them framework-agnostically.
            </p>
            <CodeBlock code={TYPES_IMPORT} vue={TYPES_IMPORT_VUE} compact />
            <CodeBlock code={TYPES_SNIPPET} />
          </section>
        </main>
      </div>
    </>
  );
}
