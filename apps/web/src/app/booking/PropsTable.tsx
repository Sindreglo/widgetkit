import React from "react";

const GROUPS = [
  {
    name: "Data",
    props: [
      { name: "availability", type: "AvailabilityDay[]", default: "—", required: true, desc: "Array of days defining which dates and time slots are bookable" },
    ],
  },
  {
    name: "Mode",
    props: [
      { name: "mode",         type: '"month-day" | "month-only" | "day-only"', default: '"month-day"',   required: false, desc: "Layout — calendar + slots side by side, calendar only, or slots only" },
      { name: "date",         type: "Date",    default: "—",             required: false, desc: "Day to display in day-only mode" },
      { name: "initialMonth", type: "Date",    default: "current month", required: false, desc: "Month shown on first render" },
      { name: "minDate",      type: "Date",    default: "—",             required: false, desc: "Earliest selectable date" },
      { name: "maxDate",      type: "Date",    default: "—",             required: false, desc: "Latest selectable date" },
    ],
  },
  {
    name: "Display",
    props: [
      { name: "showPrice",    type: "boolean", default: "true",  required: false, desc: "Show price label on day cells and slot rows" },
      { name: "showDuration", type: "boolean", default: "true",  required: false, desc: "Show duration label inside slot rows" },
    ],
  },
  {
    name: "Callbacks",
    props: [
      { name: "onSelect", type: "(selection: BookingSelection) => void", default: "—", required: false, desc: "Called when a date (month-only) or time slot is confirmed" },
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
