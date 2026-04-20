"use client";

import { useRef, useState } from "react";
import { Spreadsheet } from "@widgetkit/spreadsheet-react";
import "@widgetkit/spreadsheet-react/styles.css";
import type { CellMap, CellFormat, MergeRegion, SpreadsheetHandle } from "@widgetkit/spreadsheet-react";

const initialCells: CellMap = {
  A1: "Q1–Q3 Sales Report",
  A2: "Name",  B2: "Q1",   C2: "Q2",   D2: "Q3",   E2: "Total",
  A3: "Alice", B3: 9200,  C3: 10500,  D3: 11800,
  A4: "Bob",   B4: 7400,  C4: 8100,   D4: 9300,
  A5: "Carol", B5: 11000, C5: 12500,  D5: 13200,
  A6: "Total",
  E3: "=SUM(B3:D3)", E4: "=SUM(B4:D4)", E5: "=SUM(B5:D5)",
  B6: "=SUM(B3:B5)", C6: "=SUM(C3:C5)", D6: "=SUM(D3:D5)", E6: "=SUM(E3:E5)",
};

const initialFormats: Record<string, CellFormat> = {
  A1: { bold: true, background: "#1e293b", color: "#ffffff" },
  A2: { bold: true, background: "#f1f5f9" }, B2: { bold: true, background: "#f1f5f9" },
  C2: { bold: true, background: "#f1f5f9" }, D2: { bold: true, background: "#f1f5f9" },
  E2: { bold: true, background: "#f1f5f9" }, A6: { bold: true, background: "#f1f5f9" },
  B3: { numberFormat: "currency" }, C3: { numberFormat: "currency" }, D3: { numberFormat: "currency" },
  B4: { numberFormat: "currency" }, C4: { numberFormat: "currency" }, D4: { numberFormat: "currency" },
  B5: { numberFormat: "currency" }, C5: { numberFormat: "currency" }, D5: { numberFormat: "currency" },
  B6: { bold: true, numberFormat: "currency" }, C6: { bold: true, numberFormat: "currency" },
  D6: { bold: true, numberFormat: "currency" },
  E3: { numberFormat: "currency", color: "#16a34a" },
  E4: { numberFormat: "currency", color: "#16a34a" },
  E5: { numberFormat: "currency", color: "#16a34a" },
  E6: { bold: true, numberFormat: "currency", color: "#16a34a", background: "#f0fdf4" },
};

const initialMerges: Record<string, MergeRegion> = {
  A1: { colSpan: 5, rowSpan: 1 },
};

export function SpreadsheetDemo() {
  const ref = useRef<SpreadsheetHandle>(null);
  const [cells, setCells] = useState<CellMap>(initialCells);
  const [formats, setFormats] = useState<Record<string, CellFormat>>(initialFormats);
  const [merges, setMerges] = useState<Record<string, MergeRegion>>(initialMerges);

  const [showFormulaBar,  setShowFormulaBar]  = useState(true);
  const [showToolbar,     setShowToolbar]     = useState(true);
  const [showRowNumbers,  setShowRowNumbers]  = useState(true);
  const [showColHeaders,  setShowColHeaders]  = useState(true);
  const [showContextMenu, setShowContextMenu] = useState(true);
  const [readOnly,        setReadOnly]        = useState(false);
  const [resizableCols,   setResizableCols]   = useState(true);
  const [resizableRows,   setResizableRows]   = useState(true);
  const [autoExpandRows,  setAutoExpandRows]  = useState(true);
  const [autoExpandCols,  setAutoExpandCols]  = useState(false);

  const displayToggles: [string, boolean, (v: boolean) => void][] = [
    ["Formula bar",  showFormulaBar,  setShowFormulaBar],
    ["Toolbar",      showToolbar,     setShowToolbar],
    ["Row numbers",  showRowNumbers,  setShowRowNumbers],
    ["Col headers",  showColHeaders,  setShowColHeaders],
    ["Context menu", showContextMenu, setShowContextMenu],
  ];

  const featureToggles: [string, boolean, (v: boolean) => void][] = [
    ["Read only",      readOnly,       setReadOnly],
    ["Resizable cols", resizableCols,  setResizableCols],
    ["Resizable rows", resizableRows,  setResizableRows],
    ["Auto-expand rows", autoExpandRows, setAutoExpandRows],
    ["Auto-expand cols", autoExpandCols, setAutoExpandCols],
  ];

  const actions: [string, () => void][] = [
    ["scrollToCell(E6)", () => ref.current?.scrollToCell("E6")],
    ["setSelection(B3)", () => ref.current?.setSelection("B3")],
    ["exportCsv()", () => {
      const csv = ref.current?.exportCsv();
      if (!csv) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = "spreadsheet.csv";
      a.click();
    }],
  ];

  return (
    <div>
      <div className="demo-controls">
        <div className="demo-controls-group">
          <span className="demo-controls-group-label">Display</span>
          <div className="demo-controls-row">
            {displayToggles.map(([label, value, setter]) => (
              <button key={label} type="button" className={`demo-toggle-btn${value ? " active" : ""}`} onClick={() => setter(!value)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="demo-controls-group">
          <span className="demo-controls-group-label">Features</span>
          <div className="demo-controls-row">
            {featureToggles.map(([label, value, setter]) => (
              <button key={label} type="button" className={`demo-toggle-btn${value ? " active" : ""}`} onClick={() => setter(!value)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="demo-controls-group">
          <span className="demo-controls-group-label">Actions</span>
          <div className="demo-controls-row">
            {actions.map(([label, action]) => (
              <button key={label} type="button" className="demo-toggle-btn" onClick={action}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Spreadsheet
        ref={ref}
        cells={cells}
        formats={formats}
        merges={merges}
        rows={20}
        cols={8}
        maxHeight={340}
        showFormulaBar={showFormulaBar}
        showToolbar={showToolbar}
        showRowNumbers={showRowNumbers}
        showColHeaders={showColHeaders}
        showContextMenu={showContextMenu}
        readOnly={readOnly}
        resizableCols={resizableCols}
        resizableRows={resizableRows}
        autoExpandRows={autoExpandRows}
        autoExpandCols={autoExpandCols}
        onCellsChange={setCells}
        onFormatsChange={setFormats}
        onMergesChange={setMerges}
        aria-label="Sales report spreadsheet"
      />
    </div>
  );
}
