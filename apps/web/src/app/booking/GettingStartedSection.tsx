"use client";

import { useState } from "react";
import { CodeBlock } from "./CodeBlock";

const REACT = {
  install: `npm install @widgetkit/booking-react
# or
pnpm add @widgetkit/booking-react`,

  import: `import { BookingScheduler } from "@widgetkit/booking-react";
import "@widgetkit/booking-react/styles.css";`,

  basic: `import { useState } from "react";
import { BookingScheduler } from "@widgetkit/booking-react";
import "@widgetkit/booking-react/styles.css";
import type { AvailabilityDay, BookingSelection } from "@widgetkit/booking-react";

const availability: AvailabilityDay[] = [
  {
    date: "2024-06-10",
    available: true,
    price: "€40",
    slots: [
      { time: "09:00", available: true,  duration: 60, price: "€40" },
      { time: "10:00", available: true,  duration: 60, price: "€40" },
      { time: "11:00", available: false, duration: 60 },
      { time: "14:00", available: true,  duration: 90, price: "€55" },
    ],
  },
];

export function App() {
  const [selection, setSelection] = useState<BookingSelection | null>(null);

  return (
    <BookingScheduler
      availability={availability}
      onSelect={setSelection}
    />
  );
}`,
};

const VUE = {
  install: `npm install @widgetkit/booking-vue
# or
pnpm add @widgetkit/booking-vue`,

  import: `import { BookingScheduler } from "@widgetkit/booking-vue";
import "@widgetkit/booking-vue/styles.css";`,

  basic: `<script setup lang="ts">
import { ref } from "vue";
import { BookingScheduler } from "@widgetkit/booking-vue";
import "@widgetkit/booking-vue/styles.css";
import type { AvailabilityDay, BookingSelection } from "@widgetkit/booking-vue";

const availability: AvailabilityDay[] = [
  {
    date: "2024-06-10",
    available: true,
    price: "€40",
    slots: [
      { time: "09:00", available: true,  duration: 60, price: "€40" },
      { time: "10:00", available: true,  duration: 60, price: "€40" },
      { time: "11:00", available: false, duration: 60 },
      { time: "14:00", available: true,  duration: 90, price: "€55" },
    ],
  },
];

const selection = ref<BookingSelection | null>(null);
<\/script>

<template>
  <BookingScheduler
    :availability="availability"
    @select="(s) => (selection = s)"
  />
</template>`,
};

export function GettingStartedSection() {
  const [lang, setLang] = useState<"react" | "vue">("react");
  const s = lang === "react" ? REACT : VUE;

  return (
    <div>
      <div className="section-lang-tabs">
        <button
          type="button"
          className={`section-lang-btn${lang === "react" ? " active" : ""}`}
          onClick={() => setLang("react")}
        >
          React
        </button>
        <button
          type="button"
          className={`section-lang-btn${lang === "vue" ? " active" : ""}`}
          onClick={() => setLang("vue")}
        >
          Vue
        </button>
      </div>

      <p>Install the package from npm:</p>
      <CodeBlock code={s.install} compact />

      <p>Import the component and its stylesheet:</p>
      <CodeBlock code={s.import} compact />

      <p>
        Pass <code className="inline-code">availability</code> — the only
        required prop. Use <code className="inline-code">onSelect</code> to
        receive the user&apos;s selection:
      </p>
      <CodeBlock code={s.basic} />
    </div>
  );
}
