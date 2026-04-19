"use client";

import { useState } from "react";
import { TimelineScheduler } from "@widgetkit/scheduler-react";
import type { TimelineItem, Resource } from "@widgetkit/scheduler-react";

const RESOURCES: Resource[] = [
  { id: "r1", name: "Alice Hansen" },
  { id: "r2", name: "Bob Nilsen" },
  { id: "r3", name: "Carol Berg" },
  { id: "r4", name: "Dave Lund" },
];

function makeDate(h: number, m: number) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

const INITIAL_ITEMS: TimelineItem[] = [
  {
    id: "1", resourceId: "r1", name: "Sprint planning", color: "#6c63ff",
    description: "Q2 roadmap · 8 participants",
    start: makeDate(9, 0), end: makeDate(10, 30),
  },
  {
    id: "2", resourceId: "r1", name: "Lunch w/ client", color: "#f472b6",
    description: "Acme Corp · Restaurant Hygge",
    start: makeDate(12, 0), end: makeDate(13, 30),
  },
  {
    id: "3", resourceId: "r2", name: "Code review", color: "#34d399",
    description: "PR #142 — auth refactor",
    start: makeDate(9, 30), end: makeDate(11, 0),
  },
  {
    id: "4", resourceId: "r2", name: "1-on-1", color: "#fb923c",
    description: "With Carol — performance review",
    start: makeDate(14, 0), end: makeDate(14, 45),
  },
  {
    id: "5", resourceId: "r3", name: "Design sync", color: "#38bdf8",
    description: "Mobile onboarding flow",
    start: makeDate(10, 0), end: makeDate(11, 30),
  },
  {
    id: "6", resourceId: "r3", name: "QA session", color: "#a78bfa",
    description: "Release 2.4.0 — regression suite",
    start: makeDate(13, 0), end: makeDate(15, 0),
  },
  {
    id: "7", resourceId: "r4", name: "Architecture review", color: "#6c63ff",
    description: "Data pipeline redesign",
    start: makeDate(9, 0), end: makeDate(10, 0),
  },
  {
    id: "8", resourceId: "r4", name: "Team standup", color: "#34d399",
    description: "Daily · all teams",
    start: makeDate(11, 0), end: makeDate(11, 30),
  },
];

function renderItem(item: TimelineItem) {
  return (
    <div className="custom-item">
      <div className="custom-item-bar" style={{ background: item.color }} />
      <div className="custom-item-body">
        <div className="custom-item-name">{item.name}</div>
        {item.description && (
          <div className="custom-item-desc">{item.description}</div>
        )}
      </div>
    </div>
  );
}

export function CustomRenderDemo() {
  const [items, setItems] = useState<TimelineItem[]>(INITIAL_ITEMS);
  const [date, setDate] = useState(new Date());

  return (
    <div className="demo-wrapper">
      <TimelineScheduler
        resources={RESOURCES}
        items={items}
        date={date}
        draggable
        resizable
        showDateNav
        showZoomControls
        showNowLine
        showTooltip
        startHour={8}
        endHour={18}
        renderItem={renderItem}
        onItemsChange={setItems}
        onDateChange={setDate}
      />
    </div>
  );
}
