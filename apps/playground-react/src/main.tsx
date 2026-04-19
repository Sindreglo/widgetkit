import { useState } from "react";
import { createRoot } from "react-dom/client";
import { TimelineScheduler } from "@widgetkit/scheduler-react";
import type { Resource, TimelineItem } from "@widgetkit/scheduler-react";
import "@widgetkit/scheduler-react/styles.css";
import { BookingScheduler } from "@widgetkit/booking-react";
import type {
  AvailabilityDay,
  BookingMode,
  BookingSelection,
} from "@widgetkit/booking-react";
import "@widgetkit/booking-react/styles.css";
import { Spreadsheet } from "@widgetkit/spreadsheet-react";
import type { CellMap, CellFormat, MergeRegion } from "@widgetkit/spreadsheet-react";
import "@widgetkit/spreadsheet-react/styles.css";

const today = new Date();
today.setHours(0, 0, 0, 0);

function d(h: number, m = 0): Date {
  const date = new Date(today);
  date.setHours(h, m, 0, 0);
  return date;
}

const resources: Resource[] = [
  { id: "r1", name: "Alice Johnson", avatar: "https://i.pravatar.cc/64?img=1" },
  { id: "r2", name: "Bob Carter", avatar: "https://i.pravatar.cc/64?img=3" },
  { id: "r3", name: "Carol White", avatar: "https://i.pravatar.cc/64?img=5" },
  { id: "r4", name: "David Chen" },
  { id: "r5", name: "Meeting Room A" },
];

const initialItems: TimelineItem[] = [
  {
    id: "i1",
    resourceId: "r1",
    name: "Standup",
    color: "#3b82f6",
    start: d(9),
    end: d(9, 30),
  },
  {
    id: "i2",
    resourceId: "r1",
    name: "Product Review",
    color: "#8b5cf6",
    start: d(10),
    end: d(11, 30),
    description: "Q2 roadmap discussion",
  },
  {
    id: "i3",
    resourceId: "r1",
    name: "Lunch w/ Client",
    color: "#10b981",
    start: d(12),
    end: d(13),
  },
  {
    id: "i4",
    resourceId: "r1",
    name: "Design Sprint",
    color: "#ec4899",
    start: d(14),
    end: d(16),
  },
  {
    id: "i5",
    resourceId: "r2",
    name: "Sprint Planning",
    color: "#6366f1",
    start: d(9),
    end: d(11),
    description: "Planning for sprint 24",
  },
  {
    id: "i6",
    resourceId: "r2",
    name: "Code Review",
    color: "#f59e0b",
    start: d(13, 30),
    end: d(14, 30),
  },
  {
    id: "i7",
    resourceId: "r2",
    name: "1:1 with Manager",
    color: "#3b82f6",
    start: d(15, 30),
    end: d(16),
  },
  {
    id: "i8",
    resourceId: "r3",
    name: "UI Workshop",
    color: "#8b5cf6",
    start: d(9, 30),
    end: d(11, 30),
    description: "Component library review",
  },
  {
    id: "i9",
    resourceId: "r3",
    name: "Team Sync",
    color: "#10b981",
    start: d(11, 30),
    end: d(12, 30),
  },
  {
    id: "i10",
    resourceId: "r3",
    name: "User Testing",
    color: "#14b8a6",
    start: d(14),
    end: d(16, 30),
    description: "Usability test session 3",
  },
  {
    id: "i11",
    resourceId: "r4",
    name: "Infra Review",
    color: "#f97316",
    start: d(9),
    end: d(10),
    description: "Monthly infra cost review",
  },
  {
    id: "i12",
    resourceId: "r4",
    name: "Sprint Planning",
    color: "#6366f1",
    start: d(10, 30),
    end: d(12),
  },
  {
    id: "i13",
    resourceId: "r4",
    name: "Deploy Prep",
    color: "#ef4444",
    start: d(13),
    end: d(14, 30),
    description: "Staging → production",
  },
  {
    id: "i14",
    resourceId: "r4",
    name: "Documentation",
    color: "#64748b",
    start: d(15),
    end: d(17),
  },
  {
    id: "i15",
    resourceId: "r5",
    name: "Sprint Planning",
    color: "#6366f1",
    start: d(9),
    end: d(11),
  },
  {
    id: "i16",
    resourceId: "r5",
    name: "Product Review",
    color: "#8b5cf6",
    start: d(10),
    end: d(11, 30),
  },
  {
    id: "i17",
    resourceId: "r5",
    name: "Team Lunch",
    color: "#10b981",
    start: d(12),
    end: d(13),
  },
  {
    id: "i18",
    resourceId: "r5",
    name: "Design Sprint",
    color: "#ec4899",
    start: d(14),
    end: d(16),
  },
];

// ── Booking demo data ────────────────────────────────────────────────────────

function bookingDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const bookingAvailability: AvailabilityDay[] = [
  {
    date: bookingDate(1),
    available: true,
    price: "$40",
    slots: [
      { time: "08:00", available: true, duration: 30, price: "$30" },
      { time: "08:30", available: true, duration: 30, price: "$30" },
      { time: "09:00", available: true, duration: 60, price: "$40" },
      { time: "09:30", available: false, duration: 30 },
      { time: "10:00", available: true, duration: 60, price: "$40" },
      { time: "10:30", available: true, duration: 30, price: "$35" },
      { time: "11:00", available: false, duration: 60 },
      { time: "11:30", available: true, duration: 30, price: "$35" },
      { time: "12:00", available: true, duration: 60, price: "$40" },
      { time: "13:00", available: true, duration: 90, price: "$50" },
      { time: "14:00", available: true, duration: 90, price: "$50" },
      { time: "14:30", available: true, duration: 60, price: "$45" },
      { time: "15:00", available: true, duration: 90, price: "$50" },
      { time: "15:30", available: false, duration: 60 },
      { time: "16:00", available: true, duration: 60, price: "$45" },
      { time: "16:30", available: true, duration: 30, price: "$35" },
      { time: "17:00", available: true, duration: 60, price: "$45" },
    ],
  },
  {
    date: bookingDate(2),
    available: true,
    price: "$40",
    slots: [
      { time: "09:00", available: true, duration: 60, price: "$40" },
      { time: "10:00", available: false, duration: 60 },
      { time: "11:00", available: true, duration: 30, price: "$40" },
      { time: "14:00", available: true, duration: 120, price: "$55" },
    ],
  },
  {
    date: bookingDate(3),
    available: false,
  },
  {
    date: bookingDate(4),
    available: true,
    price: "$35",
    slots: [
      { time: "08:00", available: true, duration: 60, price: "$35" },
      { time: "09:00", available: true, duration: 60, price: "$35" },
      { time: "10:00", available: true, duration: 60, price: "$35" },
      { time: "11:00", available: true, duration: 60, price: "$35" },
      { time: "13:00", available: true, duration: 90, price: "$45" },
      { time: "14:00", available: true, duration: 90, price: "$45" },
      { time: "15:00", available: false, duration: 90 },
      { time: "16:00", available: true, duration: 90, price: "$45" },
    ],
  },
  {
    date: bookingDate(5),
    available: true,
    price: "$40",
    slots: [
      { time: "10:00", available: true, duration: 60, price: "$40" },
      { time: "11:00", available: true, duration: 60, price: "$40" },
      { time: "12:00", available: true, duration: 60, price: "$40" },
    ],
  },
  {
    date: bookingDate(8),
    available: true,
    price: "$40",
    slots: [
      { time: "09:00", available: true, duration: 60, price: "$40" },
      { time: "10:00", available: true, duration: 60, price: "$40" },
      { time: "14:00", available: true, duration: 90, price: "$50" },
    ],
  },
  {
    date: bookingDate(9),
    available: true,
    price: "$55",
    slots: [
      { time: "13:00", available: true, duration: 120, price: "$55" },
      { time: "14:00", available: true, duration: 120, price: "$55" },
      { time: "15:00", available: true, duration: 120, price: "$55" },
    ],
  },
];

function BookingDemo() {
  const [mode, setMode] = useState<BookingMode>("month-day");
  const [showPrice, setShowPrice] = useState(true);
  const [showDuration, setShowDuration] = useState(true);
  const [selection, setSelection] = useState<BookingSelection | null>(null);

  const checkboxes: [string, boolean, (v: boolean) => void][] = [
    ["Show price", showPrice, setShowPrice],
    ["Show duration", showDuration, setShowDuration],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          gap: 20,
          fontSize: 13,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {(["month-day", "month-only", "day-only"] as BookingMode[]).map(
            (m) => (
              <label
                key={m}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="booking-mode"
                  checked={mode === m}
                  onChange={() => {
                    setMode(m);
                    setSelection(null);
                  }}
                />
                {m}
              </label>
            ),
          )}
        </div>
        <div style={{ width: 1, height: 16, background: "#e2e8f0" }} />
        <div style={{ display: "flex", gap: 12 }}>
          {checkboxes.map(([label, value, setter]) => (
            <label
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setter(e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <BookingScheduler
          mode={mode}
          availability={bookingAvailability}
          showPrice={showPrice}
          showDuration={showDuration}
          date={mode === "day-only" ? new Date(bookingDate(1)) : undefined}
          onSelect={(s) => setSelection(s)}
        />

        {selection && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 13,
              color: "#166534",
              lineHeight: 1.6,
            }}
          >
            <strong>Selected</strong>
            <br />
            Date: {selection.date}
            {selection.time && (
              <>
                <br />
                Time: {selection.time}
              </>
            )}
            <br />
            Duration: {selection.duration} min
          </div>
        )}
      </div>
    </div>
  );
}

// ── Spreadsheet demo ─────────────────────────────────────────────────────────

const initialCells: CellMap = {
  A1: "Q1–Q3 Sales Report",
  A2: "Name",  B2: "Q1",    C2: "Q2",    D2: "Q3",    E2: "Total",
  A3: "Alice", B3: 9200,   C3: 10500,  D3: 11800,
  A4: "Bob",   B4: 7400,   C4: 8100,   D4: 9300,
  A5: "Carol", B5: 11000,  C5: 12500,  D5: 13200,
  A6: "David", B6: 6800,   C6: 7200,   D6: 8400,
  A7: "Total",
  E3: "=SUM(B3:D3)", E4: "=SUM(B4:D4)", E5: "=SUM(B5:D5)", E6: "=SUM(B6:D6)",
  B7: "=SUM(B3:B6)", C7: "=SUM(C3:C6)", D7: "=SUM(D3:D6)", E7: "=SUM(E3:E6)",
};

const initialFormats: Record<string, CellFormat> = {
  A1: { bold: true, background: '#1e293b', color: '#ffffff' },
  A2: { bold: true, background: '#f1f5f9' }, B2: { bold: true, background: '#f1f5f9' },
  C2: { bold: true, background: '#f1f5f9' }, D2: { bold: true, background: '#f1f5f9' },
  E2: { bold: true, background: '#f1f5f9' },
  A7: { bold: true, background: '#f1f5f9' },
  B3: { numberFormat: 'currency' }, C3: { numberFormat: 'currency' }, D3: { numberFormat: 'currency' },
  B4: { numberFormat: 'currency' }, C4: { numberFormat: 'currency' }, D4: { numberFormat: 'currency' },
  B5: { numberFormat: 'currency' }, C5: { numberFormat: 'currency' }, D5: { numberFormat: 'currency' },
  B6: { numberFormat: 'currency' }, C6: { numberFormat: 'currency' }, D6: { numberFormat: 'currency' },
  B7: { bold: true, numberFormat: 'currency' }, C7: { bold: true, numberFormat: 'currency' },
  D7: { bold: true, numberFormat: 'currency' },
  E3: { numberFormat: 'currency', color: '#16a34a' }, E4: { numberFormat: 'currency', color: '#16a34a' },
  E5: { numberFormat: 'currency', color: '#16a34a' }, E6: { numberFormat: 'currency', color: '#16a34a' },
  E7: { bold: true, numberFormat: 'currency', color: '#16a34a', background: '#f0fdf4' },
};

const initialMerges: Record<string, MergeRegion> = {
  A1: { colSpan: 5, rowSpan: 1 },
};

function SpreadsheetDemo() {
  const [cells, setCells] = useState<CellMap>(initialCells);
  const [formats, setFormats] = useState<Record<string, CellFormat>>(initialFormats);
  const [merges, setMerges] = useState<Record<string, MergeRegion>>(initialMerges);

  return (
    <Spreadsheet
      cells={cells}
      rows={40}
      cols={40}
      maxHeight={360}
      showToolbar
      formats={formats}
      merges={merges}
      onCellsChange={setCells}
      onFormatsChange={setFormats}
      onMergesChange={setMerges}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [items, setItems] = useState(initialItems);
  const [date, setDate] = useState(today);
  const [zoom, setZoom] = useState<1 | 2 | 4>(1);
  const [draggable, setDraggable] = useState(true);
  const [resizable, setResizable] = useState(true);
  const [creatable, setCreatable] = useState(true);
  const [editable, setEditable] = useState(true);
  const [showTime, setShowTime] = useState(true);
  const [showAvatar, setShowAvatar] = useState(true);
  const [showEventCount, setShowEventCount] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showNowLine, setShowNowLine] = useState(true);
  const [showNav, setShowNav] = useState(true);
  const [showDateNav, setShowDateNav] = useState(true);
  const [showZoomControls, setShowZoomControls] = useState(true);
  const [log, setLog] = useState("");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 24,
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>
        WidgetKit — React playground
      </h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
        {(
          [
            ["Draggable", draggable, setDraggable],
            ["Resizable", resizable, setResizable],
            ["Creatable", creatable, setCreatable],
            ["Editable", editable, setEditable],
            ["Show Time", showTime, setShowTime],
            ["Show Avatar", showAvatar, setShowAvatar],
            ["Event Count", showEventCount, setShowEventCount],
            ["Tooltip", showTooltip, setShowTooltip],
            ["Now Line", showNowLine, setShowNowLine],
            ["Nav Bar", showNav, setShowNav],
            ["Date Nav", showDateNav, setShowDateNav],
            ["Zoom Controls", showZoomControls, setShowZoomControls],
          ] as const
        ).map(([label, value, setter]) => (
          <label
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => setter(e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>

      <div
        style={{
          background: "#f8fafc",
          padding: 8,
          borderRadius: 4,
          fontSize: 12,
          minHeight: 24,
          color: "#475569",
        }}
      >
        {log || "Events will appear here"}
      </div>

      <h2
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#1e293b",
          marginTop: 8,
        }}
      >
        scheduler-react
      </h2>

      <div style={{ flex: 1, maxHeight: 600 }}>
        <TimelineScheduler
          resources={resources}
          items={items}
          date={date}
          startHour={8}
          endHour={18}
          zoom={zoom}
          draggable={draggable}
          resizable={resizable}
          creatable={creatable}
          editable={editable}
          showTime={showTime}
          showAvatar={showAvatar}
          showEventCount={showEventCount}
          showTooltip={showTooltip}
          showNowLine={showNowLine}
          showNav={showNav}
          showDateNav={showDateNav}
          showZoomControls={showZoomControls}
          onItemsChange={setItems}
          onDateChange={setDate}
          onZoomChange={setZoom}
          onItemCreate={({ resourceId, start, end }) => {
            setItems((prev) => [
              ...prev,
              {
                id: `i${Date.now()}`,
                resourceId,
                name: "New event",
                color: "#64748b",
                start,
                end,
              },
            ]);
            setLog(`Created event on ${resourceId}`);
          }}
          onItemClick={({ item }) => setLog(`Click: ${item.name}`)}
          onItemDblClick={({ item }) => setLog(`Dblclick: ${item.name}`)}
          onItemDragEnd={({ item, resourceId, start, end }) =>
            setLog(
              `Drag end: ${
                item.name
              } → ${resourceId} ${start.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}–${end.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`,
            )
          }
          onItemResizeEnd={({ item, start, end }) =>
            setLog(
              `Resize end: ${item.name} ${start.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}–${end.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`,
            )
          }
        />
      </div>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#1e293b",
          marginTop: 24,
        }}
      >
        booking-react
      </h2>

      <BookingDemo />

      <h2
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#1e293b",
          marginTop: 24,
        }}
      >
        spreadsheet-react
      </h2>

      <SpreadsheetDemo />

      <div style={{ height: 80 }} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
