"use client";

import { useState } from "react";
import { TimelineScheduler } from "@widgetkit/scheduler-react";
import type { TimelineItem, Resource } from "@widgetkit/scheduler-react";

const RESOURCES: Resource[] = [
  { id: "r1", name: "Alice Hansen", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=alice" },
  { id: "r2", name: "Bob Nilsen", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=bob" },
  { id: "r3", name: "Carol Berg", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=carol" },
  { id: "r4", name: "Dave Lund", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=dave" },
  { id: "r5", name: "Eva Strand", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=eva" },
];

function makeDate(h: number, m: number) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

const ITEMS: TimelineItem[] = [
  { id: "1", resourceId: "r1", name: "Standup", color: "#6c63ff", start: makeDate(9, 0), end: makeDate(9, 30) },
  { id: "2", resourceId: "r1", name: "Product review", color: "#a78bfa", start: makeDate(11, 0), end: makeDate(12, 0) },
  { id: "3", resourceId: "r1", name: "All-hands", color: "#34d399", start: makeDate(15, 0), end: makeDate(16, 0) },
  { id: "4", resourceId: "r2", name: "Sprint planning", color: "#fb923c", start: makeDate(9, 30), end: makeDate(11, 0) },
  { id: "5", resourceId: "r2", name: "Lunch w/ client", color: "#f472b6", start: makeDate(12, 0), end: makeDate(13, 0) },
  { id: "6", resourceId: "r2", name: "All-hands", color: "#34d399", start: makeDate(15, 0), end: makeDate(16, 0) },
  { id: "7", resourceId: "r3", name: "Design sync", color: "#38bdf8", start: makeDate(10, 0), end: makeDate(11, 30) },
  { id: "8", resourceId: "r3", name: "QA session", color: "#a78bfa", start: makeDate(13, 0), end: makeDate(15, 0) },
  { id: "9", resourceId: "r4", name: "Architecture review", color: "#6c63ff", start: makeDate(9, 0), end: makeDate(10, 30) },
  { id: "10", resourceId: "r4", name: "Code review", color: "#34d399", start: makeDate(13, 30), end: makeDate(15, 0) },
  { id: "11", resourceId: "r5", name: "Onboarding", color: "#fb923c", start: makeDate(9, 0), end: makeDate(12, 0) },
  { id: "12", resourceId: "r5", name: "Team coffee", color: "#f472b6", start: makeDate(14, 0), end: makeDate(14, 30) },
];

export function ReadOnlyDemo() {
  const [date, setDate] = useState(new Date());

  return (
    <div className="demo-wrapper">
      <TimelineScheduler
        resources={RESOURCES}
        items={ITEMS}
        date={date}
        readonly
        showDateNav
        showZoomControls
        showAvatar
        showNowLine
        showTooltip
        startHour={8}
        endHour={18}
        onDateChange={setDate}
      />
    </div>
  );
}
