"use client";

import { useState } from "react";
import { TimelineScheduler } from "@widgetkit/scheduler-react";
import type { TimelineItem, Resource } from "@widgetkit/scheduler-react";

const RESOURCES: Resource[] = [
  { id: "r1", name: "Alice Hansen" },
  { id: "r2", name: "Bob Nilsen" },
  { id: "r3", name: "Carol Berg" },
];

function makeDate(h: number, m: number) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

const INITIAL_ITEMS: TimelineItem[] = [
  { id: "1", resourceId: "r1", name: "Standup", color: "#6c63ff", start: makeDate(9, 0), end: makeDate(9, 30) },
  { id: "2", resourceId: "r1", name: "Design review", color: "#a78bfa", start: makeDate(11, 0), end: makeDate(12, 30) },
  { id: "3", resourceId: "r2", name: "Sprint planning", color: "#34d399", start: makeDate(9, 30), end: makeDate(11, 0) },
  { id: "4", resourceId: "r2", name: "Client call", color: "#fb923c", start: makeDate(13, 0), end: makeDate(14, 0) },
  { id: "5", resourceId: "r3", name: "Code review", color: "#38bdf8", start: makeDate(10, 0), end: makeDate(11, 30) },
  { id: "6", resourceId: "r3", name: "Deploy prep", color: "#f472b6", start: makeDate(14, 30), end: makeDate(16, 0) },
];

export function DragDropDemo() {
  const [items, setItems] = useState<TimelineItem[]>(INITIAL_ITEMS);
  const [date, setDate] = useState(new Date());
  const [lastAction, setLastAction] = useState<string | null>(null);

  return (
    <div>
      {lastAction && (
        <div className="demo-event-log">
          <span className="demo-event-dot" />
          {lastAction}
        </div>
      )}
      <div className="demo-wrapper">
        <TimelineScheduler
          resources={RESOURCES}
          items={items}
          date={date}
          draggable
          resizable
          creatable
          showDateNav
          showZoomControls
          showNowLine
          showTooltip
          snapMinutes={15}
          startHour={8}
          endHour={18}
          onItemsChange={setItems}
          onDateChange={setDate}
          onItemDragEnd={({ item }) =>
            setLastAction(`Moved "${item.name}" to ${item.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`)
          }
          onItemResizeEnd={({ item }) =>
            setLastAction(`Resized "${item.name}" → ${item.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${item.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`)
          }
          onItemCreate={({ resourceId, start }) =>
            setLastAction(`Created event for "${RESOURCES.find((r) => r.id === resourceId)?.name}" at ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`)
          }
        />
      </div>
    </div>
  );
}
