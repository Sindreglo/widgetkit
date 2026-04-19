"use client";

import { useState } from "react";
import { TimelineScheduler } from "@widgetkit/scheduler-react";
import "@widgetkit/scheduler-react/styles.css";
import type { TimelineItem, Resource } from "@widgetkit/scheduler-react";

const RESOURCES: Resource[] = [
  { id: "alice", name: "Alice Hansen" },
  { id: "bob", name: "Bob Nilsen" },
  { id: "carol", name: "Carol Berg" },
  { id: "dave", name: "Dave Lund" },
];

function makeDate(h: number, m: number, offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(h, m, 0, 0);
  return d;
}

const INITIAL_ITEMS: TimelineItem[] = [
  {
    id: "1",
    resourceId: "alice",
    name: "Standup",
    color: "#6c63ff",
    start: makeDate(9, 0),
    end: makeDate(9, 30),
  },
  {
    id: "2",
    resourceId: "alice",
    name: "Design review",
    color: "#a78bfa",
    start: makeDate(11, 0),
    end: makeDate(12, 30),
  },
  {
    id: "3",
    resourceId: "bob",
    name: "Sprint planning",
    color: "#34d399",
    start: makeDate(9, 30),
    end: makeDate(11, 0),
  },
  {
    id: "4",
    resourceId: "bob",
    name: "1-on-1 with Carol",
    color: "#f472b6",
    start: makeDate(14, 0),
    end: makeDate(14, 30),
  },
  {
    id: "5",
    resourceId: "carol",
    name: "Client call",
    color: "#fb923c",
    start: makeDate(10, 0),
    end: makeDate(11, 0),
  },
  {
    id: "6",
    resourceId: "carol",
    name: "QA session",
    color: "#38bdf8",
    start: makeDate(13, 0),
    end: makeDate(15, 0),
  },
  {
    id: "7",
    resourceId: "dave",
    name: "Architecture sync",
    color: "#6c63ff",
    start: makeDate(9, 0),
    end: makeDate(10, 30),
  },
  {
    id: "8",
    resourceId: "dave",
    name: "Code review",
    color: "#a78bfa",
    start: makeDate(15, 0),
    end: makeDate(16, 0),
  },
];

export function SchedulerDemo() {
  const [items, setItems] = useState<TimelineItem[]>(INITIAL_ITEMS);
  const [date, setDate] = useState(new Date());

  return (
    <div className="scheduler-demo">
      <TimelineScheduler
        resources={RESOURCES}
        items={items}
        date={date}
        draggable
        resizable
        creatable
        showNav
        showDateNav
        showZoomControls
        showNowLine
        showTooltip
        onItemsChange={setItems}
        onDateChange={setDate}
      />
    </div>
  );
}
