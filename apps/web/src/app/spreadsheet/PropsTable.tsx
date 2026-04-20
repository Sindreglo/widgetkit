import React from "react";

const GROUPS = [
  {
    name: "Data",
    props: [
      { name: "cells",          type: "CellMap",                          default: "—",      required: false, desc: "Controlled cell values. Use with onCellsChange." },
      { name: "defaultCells",   type: "CellMap",                          default: "—",      required: false, desc: "Initial cell values for uncontrolled usage." },
      { name: "formats",        type: "Record<string, CellFormat>",        default: "—",      required: false, desc: "Controlled cell formats (bold, color, number format, etc.)." },
      { name: "defaultFormats", type: "Record<string, CellFormat>",        default: "—",      required: false, desc: "Initial formats for uncontrolled usage." },
      { name: "merges",         type: "Record<string, MergeRegion>",       default: "—",      required: false, desc: "Controlled merge regions." },
      { name: "defaultMerges",  type: "Record<string, MergeRegion>",       default: "—",      required: false, desc: "Initial merges for uncontrolled usage." },
    ],
  },
  {
    name: "Grid",
    props: [
      { name: "rows",            type: "number", default: "100",    required: false, desc: "Number of rows in the grid." },
      { name: "cols",            type: "number", default: "26",     required: false, desc: "Number of columns in the grid." },
      { name: "rowHeight",       type: "number", default: "28",     required: false, desc: "Default row height in pixels." },
      { name: "defaultColWidth", type: "number", default: "100",    required: false, desc: "Default column width in pixels." },
      { name: "maxHeight",       type: "number", default: "—",      required: false, desc: "Maximum container height in pixels. Enables vertical scrolling." },
    ],
  },
  {
    name: "Visibility",
    props: [
      { name: "showFormulaBar",  type: "boolean", default: "true",  required: false, desc: "Show the formula bar above the grid." },
      { name: "showToolbar",     type: "boolean", default: "true",  required: false, desc: "Show the formatting toolbar." },
      { name: "showRowNumbers",  type: "boolean", default: "true",  required: false, desc: "Show row number column on the left." },
      { name: "showColHeaders",  type: "boolean", default: "true",  required: false, desc: "Show column letter headers at the top." },
      { name: "showContextMenu", type: "boolean", default: "true",  required: false, desc: "Show the right-click context menu." },
    ],
  },
  {
    name: "Interaction",
    props: [
      { name: "readOnly",        type: "boolean",              default: "false",   required: false, desc: "Disable all editing. Selection and copying still work." },
      { name: "resizableCols",   type: "boolean",              default: "true",    required: false, desc: "Allow columns to be resized by dragging their borders." },
      { name: "resizableRows",   type: "boolean",              default: "true",    required: false, desc: "Allow rows to be resized by dragging their borders." },
      { name: "selectionMode",   type: '"single" | "range"',   default: '"range"', required: false, desc: "Whether multi-cell range selection is allowed." },
      { name: "autoExpandRows",  type: "boolean",              default: "true",    required: false, desc: "Automatically add rows when the last row is reached." },
      { name: "autoExpandCols",  type: "boolean",              default: "false",   required: false, desc: "Automatically add columns when the last column is reached." },
    ],
  },
  {
    name: "Callbacks",
    props: [
      { name: "onCellsChange",    type: "(cells: CellMap) => void",                              default: "—", required: false, desc: "Called with the full updated cell map after any edit." },
      { name: "onCellChange",     type: "(ref: string, value: CellValue) => void",               default: "—", required: false, desc: "Called for each individual cell edit." },
      { name: "onFormatsChange",  type: "(formats: Record<string, CellFormat>) => void",         default: "—", required: false, desc: "Called when cell formatting changes." },
      { name: "onMergesChange",   type: "(merges: Record<string, MergeRegion>) => void",         default: "—", required: false, desc: "Called when cell merges change." },
      { name: "onSelectionChange",type: "(ref: string) => void",                                 default: "—", required: false, desc: "Called when the selected cell or range changes." },
      { name: "onCellClick",      type: "(ref: string, value: CellValue, e: MouseEvent) => void",default: "—", required: false, desc: "Called on single click." },
      { name: "onCellDoubleClick",type: "(ref: string, value: CellValue, e: MouseEvent) => void",default: "—", required: false, desc: "Called on double-click." },
    ],
  },
  {
    name: "Advanced",
    props: [
      { name: "renderCell",       type: "(ref, value, format?) => ReactNode",                    default: "—", required: false, desc: "Custom cell renderer. Return null to use the default." },
      { name: "onBeforeEdit",     type: "(ref: string, current: CellValue) => boolean",          default: "—", required: false, desc: "Return false to prevent editing a specific cell." },
      { name: "onValidate",       type: "(ref: string, value: CellValue) => string | null",      default: "—", required: false, desc: "Return an error string to reject the new value, or null to accept." },
      { name: "contextMenuItems", type: "Array<ContextMenuItem | null>",                         default: "—", required: false, desc: "Extra items appended to the right-click context menu. null inserts a divider." },
      { name: "aria-label",       type: "string",                                                default: "—", required: false, desc: "Accessible label for the grid element." },
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
