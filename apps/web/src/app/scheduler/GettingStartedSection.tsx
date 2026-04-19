"use client";

import { useState } from "react";
import { CodeBlock } from "./CodeBlock";

const REACT = {
  install: `npm install @widgetkit/scheduler-react
# or
pnpm add @widgetkit/scheduler-react`,

  import: `import { TimelineScheduler } from "@widgetkit/scheduler-react";
import "@widgetkit/scheduler-react/styles.css";`,

  basic: `import { useState } from "react";
import { TimelineScheduler } from "@widgetkit/scheduler-react";
import "@widgetkit/scheduler-react/styles.css";
import type { Resource, TimelineItem } from "@widgetkit/scheduler-react";

const resources: Resource[] = [
  { id: "alice", name: "Alice Hansen" },
  { id: "bob",   name: "Bob Nilsen" },
];

const initialItems: TimelineItem[] = [
  {
    id: "1",
    resourceId: "alice",
    name: "Team standup",
    color: "#6c63ff",
    start: new Date("2024-06-10T09:00"),
    end:   new Date("2024-06-10T09:30"),
  },
];

export function App() {
  const [items, setItems] = useState(initialItems);
  const [date, setDate] = useState(new Date());

  return (
    <TimelineScheduler
      resources={resources}
      items={items}
      date={date}
      startHour={8}
      endHour={20}
      draggable
      resizable
      creatable
      showDateNav
      showZoomControls
      showNowLine
      showTooltip
      onItemsChange={setItems}
      onDateChange={setDate}
    />
  );
}`,
};

const VUE = {
  install: `npm install @widgetkit/scheduler-vue
# or
pnpm add @widgetkit/scheduler-vue`,

  import: `import { SchedulerVue } from "@widgetkit/scheduler-vue";
import "@widgetkit/scheduler-vue/styles.css";`,

  basic: `<script setup lang="ts">
import { ref } from "vue";
import { SchedulerVue } from "@widgetkit/scheduler-vue";
import "@widgetkit/scheduler-vue/styles.css";
import type { Resource, TimelineItem } from "@widgetkit/scheduler-vue";

const resources: Resource[] = [
  { id: "alice", name: "Alice Hansen" },
  { id: "bob",   name: "Bob Nilsen" },
];

const initialItems: TimelineItem[] = [
  {
    id: "1",
    resourceId: "alice",
    name: "Team standup",
    color: "#6c63ff",
    start: new Date("2024-06-10T09:00"),
    end:   new Date("2024-06-10T09:30"),
  },
];

const date  = ref(new Date());
const items = ref(initialItems);
<\/script>

<template>
  <SchedulerVue
    :resources="resources"
    v-model:items="items"
    v-model:date="date"
    :start-hour="8"
    :end-hour="20"
    draggable
    resizable
    creatable
    show-date-nav
    show-zoom-controls
    show-now-line
    show-tooltip
  />
</template>`,
};

const JS = {
  install: `npm install @widgetkit/scheduler-js
# or
pnpm add @widgetkit/scheduler-js`,

  import: `import { createScheduler } from "@widgetkit/scheduler-js";
import "@widgetkit/scheduler-js/styles.css";`,

  basic: `import { createScheduler } from "@widgetkit/scheduler-js";
import "@widgetkit/scheduler-js/styles.css";
import type { Resource, TimelineItem } from "@widgetkit/scheduler-js";

const resources: Resource[] = [
  { id: "alice", name: "Alice Hansen" },
  { id: "bob",   name: "Bob Nilsen" },
];

const initialItems: TimelineItem[] = [
  {
    id: "1",
    resourceId: "alice",
    name: "Team standup",
    color: "#6c63ff",
    start: new Date("2024-06-10T09:00"),
    end:   new Date("2024-06-10T09:30"),
  },
];

const scheduler = createScheduler(document.getElementById("scheduler"), {
  resources,
  items:     initialItems,
  date:      new Date(),
  startHour: 8,
  endHour:   20,
  draggable: true,
  resizable: true,
  creatable: true,
  showDateNav:      true,
  showZoomControls: true,
  showNowLine:      true,
  showTooltip:      true,
  onItemsChange: (items) => scheduler.setOptions({ items }),
  onDateChange:  (date)  => scheduler.setOptions({ date }),
});`,
};

export function GettingStartedSection() {
  const [lang, setLang] = useState<"react" | "vue" | "js">("react");
  const s = lang === "react" ? REACT : lang === "vue" ? VUE : JS;

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
        <button
          type="button"
          className={`section-lang-btn${lang === "js" ? " active" : ""}`}
          onClick={() => setLang("js")}
        >
          JS
        </button>
      </div>

      <p>Install the package from npm:</p>
      <CodeBlock code={s.install} compact />

      <p>Import the component and its stylesheet:</p>
      <CodeBlock code={s.import} compact />

      <p>
        Pass <code className="inline-code">resources</code>,{" "}
        <code className="inline-code">items</code>, and{" "}
        <code className="inline-code">date</code> — those are the only required
        props. Enable interactions with boolean flags:
      </p>
      <CodeBlock code={s.basic} />
    </div>
  );
}
