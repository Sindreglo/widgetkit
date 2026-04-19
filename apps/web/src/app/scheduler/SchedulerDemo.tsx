"use client";

import { useState } from "react";
import { TimelineScheduler } from "@widgetkit/scheduler-react";
import "@widgetkit/scheduler-react/styles.css";
import type { TimelineItem, Resource } from "@widgetkit/scheduler-react";

const RESOURCES: Resource[] = [
  { id: "alice", name: "Alice Hansen", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=alice" },
  { id: "bob",   name: "Bob Nilsen",   avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=bob" },
  { id: "carol", name: "Carol Berg",   avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=carol" },
  { id: "dave",  name: "Dave Lund",    avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=dave" },
];

function d(h: number, m: number) {
  const x = new Date();
  x.setHours(h, m, 0, 0);
  return x;
}

const INITIAL_ITEMS: TimelineItem[] = [
  { id: "1",  resourceId: "alice", name: "Standup",           color: "#6c63ff", start: d(9,  0),  end: d(9,  30) },
  { id: "2",  resourceId: "alice", name: "Design review",     color: "#a78bfa", start: d(11, 0),  end: d(12, 30) },
  { id: "3",  resourceId: "alice", name: "Lunch w/ client",   color: "#f472b6", start: d(13, 0),  end: d(14, 0)  },
  { id: "4",  resourceId: "alice", name: "Late sync",         color: "#6c63ff", start: d(17, 30), end: d(19, 0)  },
  { id: "5",  resourceId: "bob",   name: "Sprint planning",   color: "#34d399", start: d(9,  30), end: d(11, 0)  },
  { id: "6",  resourceId: "bob",   name: "1-on-1 w/ Carol",  color: "#f472b6", start: d(14, 0),  end: d(14, 30) },
  { id: "7",  resourceId: "bob",   name: "Deploy prep",       color: "#fb923c", start: d(16, 0),  end: d(17, 30) },
  { id: "8",  resourceId: "bob",   name: "On-call handover",  color: "#38bdf8", start: d(18, 0),  end: d(18, 30) },
  { id: "9",  resourceId: "carol", name: "Client call",       color: "#fb923c", start: d(10, 0),  end: d(11, 0)  },
  { id: "10", resourceId: "carol", name: "QA session",        color: "#38bdf8", start: d(13, 0),  end: d(15, 0)  },
  { id: "11", resourceId: "carol", name: "Retro",             color: "#a78bfa", start: d(16, 30), end: d(17, 30) },
  { id: "12", resourceId: "dave",  name: "Architecture sync", color: "#6c63ff", start: d(9,  0),  end: d(10, 30) },
  { id: "13", resourceId: "dave",  name: "Code review",       color: "#a78bfa", start: d(13, 30), end: d(15, 0)  },
  { id: "14", resourceId: "dave",  name: "Team coffee",       color: "#34d399", start: d(15, 30), end: d(16, 0)  },
  { id: "15", resourceId: "dave",  name: "Evening standup",   color: "#fb923c", start: d(18, 0),  end: d(18, 30) },
];

type BoolKey =
  | "draggable" | "resizable" | "creatable" | "editable" | "readonly"
  | "showTime" | "showTooltip" | "showNowLine" | "showAvatar" | "showEventCount"
  | "showDateNav" | "showZoomControls" | "showNav";

const DEFAULTS: Record<BoolKey, boolean> = {
  draggable:        true,
  resizable:        true,
  creatable:        true,
  editable:         true,
  readonly:         false,
  showTime:         true,
  showTooltip:      true,
  showNowLine:      true,
  showAvatar:       false,
  showEventCount:   false,
  showDateNav:      true,
  showZoomControls: true,
  showNav:          false,
};

const CONTROLS: { group: string; items: { key: BoolKey; label: string }[] }[] = [
  {
    group: "Interaction",
    items: [
      { key: "draggable",  label: "Draggable" },
      { key: "resizable",  label: "Resizable" },
      { key: "creatable",  label: "Creatable" },
      { key: "editable",   label: "Editable" },
      { key: "readonly",   label: "Read only" },
    ],
  },
  {
    group: "Display",
    items: [
      { key: "showTime",       label: "Time" },
      { key: "showTooltip",    label: "Tooltip" },
      { key: "showNowLine",    label: "Now line" },
      { key: "showAvatar",     label: "Avatar" },
      { key: "showEventCount", label: "Event count" },
    ],
  },
  {
    group: "Navigation",
    items: [
      { key: "showDateNav",      label: "Date nav" },
      { key: "showZoomControls", label: "Zoom" },
      { key: "showNav",          label: "Nav bar" },
    ],
  },
];

export function SchedulerDemo() {
  const [items, setItems] = useState<TimelineItem[]>(INITIAL_ITEMS);
  const [date, setDate] = useState(new Date());
  const [opts, setOpts] = useState<Record<BoolKey, boolean>>(DEFAULTS);

  const toggle = (key: BoolKey) =>
    setOpts((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      <div className="demo-controls">
        {CONTROLS.map(({ group, items: groupItems }) => (
          <div key={group} className="demo-controls-group">
            <span className="demo-controls-group-label">{group}</span>
            <div className="demo-controls-row">
              {groupItems.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`demo-toggle-btn${opts[key] ? " active" : ""}`}
                  onClick={() => toggle(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="scheduler-demo">
        <TimelineScheduler
          resources={RESOURCES}
          items={items}
          date={date}
          startHour={8}
          endHour={20}
          draggable={opts.draggable}
          resizable={opts.resizable}
          creatable={opts.creatable}
          editable={opts.editable}
          readonly={opts.readonly}
          showTime={opts.showTime}
          showTooltip={opts.showTooltip}
          showNowLine={opts.showNowLine}
          showAvatar={opts.showAvatar}
          showEventCount={opts.showEventCount}
          showDateNav={opts.showDateNav}
          showZoomControls={opts.showZoomControls}
          showNav={opts.showNav}
          onItemsChange={setItems}
          onDateChange={setDate}
        />
      </div>
    </div>
  );
}
