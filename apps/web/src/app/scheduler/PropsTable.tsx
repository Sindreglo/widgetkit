import React from "react";

const GROUPS = [
  {
    name: "Data",
    props: [
      { name: "resources",  type: "Resource[]",      default: "—", required: true,  desc: "Array of resources rendered as rows" },
      { name: "items",      type: "TimelineItem[]",   default: "—", required: true,  desc: "Array of events to display" },
      { name: "date",       type: "Date",             default: "—", required: true,  desc: "Currently displayed date" },
    ],
  },
  {
    name: "Time range",
    props: [
      { name: "startHour",    type: "number", default: "0",  required: false, desc: "First visible hour (0–23)" },
      { name: "endHour",      type: "number", default: "24", required: false, desc: "Last visible hour (1–24)" },
      { name: "snapMinutes",  type: "number", default: "15", required: false, desc: "Snap interval for drag and create interactions" },
    ],
  },
  {
    name: "Interaction",
    props: [
      { name: "draggable",           type: "boolean", default: "true",  required: false, desc: "Allow moving events to a new time or resource" },
      { name: "resizable",           type: "boolean", default: "false", required: false, desc: "Allow resizing events by dragging their edges" },
      { name: "creatable",           type: "boolean", default: "false", required: false, desc: "Allow creating events by clicking and dragging on empty space" },
      { name: "editable",            type: "boolean", default: "true",  required: false, desc: "Allow editing events via the built-in modal" },
      { name: "readonly",            type: "boolean", default: "false", required: false, desc: "Disable all interactions — overrides draggable, resizable, creatable, editable" },
      { name: "minDurationMinutes",  type: "number",  default: "0",     required: false, desc: "Minimum event duration in minutes (0 = no limit)" },
      { name: "maxDurationMinutes",  type: "number",  default: "0",     required: false, desc: "Maximum event duration in minutes (0 = no limit)" },
    ],
  },
  {
    name: "Display",
    props: [
      { name: "zoom",             type: "1 | 2 | 4", default: "1",     required: false, desc: "Horizontal zoom level" },
      { name: "showNav",          type: "boolean",   default: "false",  required: false, desc: "Show the built-in navigation bar" },
      { name: "showDateNav",      type: "boolean",   default: "true",   required: false, desc: "Show previous / next day arrows" },
      { name: "showZoomControls", type: "boolean",   default: "true",   required: false, desc: "Show zoom level buttons" },
      { name: "showTime",         type: "boolean",   default: "true",   required: false, desc: "Show time label inside events" },
      { name: "showAvatar",       type: "boolean",   default: "true",   required: false, desc: "Show resource avatar in the row header" },
      { name: "showEventCount",   type: "boolean",   default: "true",   required: false, desc: "Show count badge when events overlap" },
      { name: "showTooltip",      type: "boolean",   default: "true",   required: false, desc: "Show hover tooltip with event details" },
      { name: "showNowLine",      type: "boolean",   default: "true",   required: false, desc: "Show live indicator for the current time" },
    ],
  },
  {
    name: "Custom rendering",
    props: [
      { name: "renderItem", type: "(item: TimelineItem) => ReactNode", default: "—", required: false, desc: "Replaces the default event card with custom content" },
    ],
  },
  {
    name: "Callbacks",
    props: [
      { name: "onItemsChange",     type: "(items: TimelineItem[]) => void",        default: "—", required: false, desc: "Full updated items array after any change" },
      { name: "onDateChange",      type: "(date: Date) => void",                   default: "—", required: false, desc: "Displayed date changed" },
      { name: "onZoomChange",      type: "(zoom: 1 | 2 | 4) => void",             default: "—", required: false, desc: "Zoom level changed" },
      { name: "onItemCreate",      type: "(detail: ItemCreateDetail) => void",     default: "—", required: false, desc: "New event drawn by the user" },
      { name: "onItemClick",       type: "(detail: ItemClickDetail) => void",      default: "—", required: false, desc: "Event single-clicked" },
      { name: "onItemDblClick",    type: "(detail: ItemDblClickDetail) => void",   default: "—", required: false, desc: "Event double-clicked" },
      { name: "onItemHover",       type: "(detail: ItemHoverDetail) => void",      default: "—", required: false, desc: "Mouse entered or left an event" },
      { name: "onItemContextMenu", type: "(detail: ItemContextMenuDetail) => void",default: "—", required: false, desc: "Event right-clicked" },
      { name: "onItemDragStart",   type: "(detail: ItemDragStartDetail) => void",  default: "—", required: false, desc: "Drag interaction began" },
      { name: "onItemDragEnd",     type: "(detail: ItemDragEndDetail) => void",    default: "—", required: false, desc: "Drag ended with new resourceId, start, end" },
      { name: "onItemResizeStart", type: "(detail: ItemResizeStartDetail) => void",default: "—", required: false, desc: "Resize interaction began" },
      { name: "onItemResizeEnd",   type: "(detail: ItemResizeEndDetail) => void",  default: "—", required: false, desc: "Resize ended with new start and end" },
    ],
  },
];

export function PropsTable() {
  return (
    <div className="props-table-wrap">
      <table className="props-table">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {GROUPS.map(({ name, props }) => (
            <React.Fragment key={name}>
              <tr className="props-table-group">
                <td colSpan={4}>{name}</td>
              </tr>
              {props.map((p) => (
                <tr key={p.name}>
                  <td>
                    <code className="inline-code">{p.name}</code>
                    {p.required && <span className="prop-required">*</span>}
                  </td>
                  <td><code className="prop-type">{p.type}</code></td>
                  <td><span className="prop-default">{p.default}</span></td>
                  <td className="prop-desc">{p.desc}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
