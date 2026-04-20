import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "./Sidebar";
import { SpreadsheetDemo } from "./SpreadsheetDemo";
import { LargeDataDemo } from "./LargeDataDemo";
import { GettingStartedSection } from "./GettingStartedSection";
import { PropsTable } from "./PropsTable";
import { CodeBlock } from "./CodeBlock";

export const metadata: Metadata = {
  title: "Spreadsheet — WidgetKit",
  description: "A lightweight React spreadsheet with inline editing, formula support, formatting, cell merges, and keyboard navigation.",
};

const CONTROLLED_SNIPPET = `import { useState } from "react";
import { Spreadsheet } from "@widgetkit/spreadsheet-react";
import "@widgetkit/spreadsheet-react/styles.css";
import type { CellMap } from "@widgetkit/spreadsheet-react";

export function App() {
  const [cells, setCells] = useState<CellMap>({
    A1: "Name",  B1: "Score",
    A2: "Alice", B2: 95,
    A3: "Bob",   B3: 87,
    A4: "Total", B4: "=SUM(B2:B3)",
  });

  return (
    <Spreadsheet
      cells={cells}
      onCellsChange={setCells}
      rows={10}
      cols={4}
    />
  );
}`;

const FORMULAS_SNIPPET = `// Cells starting with "=" are evaluated as formulas
const cells: CellMap = {
  A1: 100, B1: 200, C1: 300,
  A2: "=SUM(A1:C1)",                         // 600
  A3: "=AVERAGE(A1:C1)",                     // 200
  A4: '=IF(A2>500, "High", "Low")',          // "High"
  A5: '=CONCAT("Total: ", A2)',              // "Total: 600"
  A6: '=IFERROR(A1/0, "Div error")',         // "Div error"
};

// Supported functions
// Math:   SUM, AVERAGE, MIN, MAX, ABS, ROUND, FLOOR, CEILING, SQRT, POWER, MOD
// Logic:  IF, AND, OR, NOT, IFERROR
// Text:   CONCAT, LEN, UPPER, LOWER, TRIM, LEFT, RIGHT, MID
// Info:   ISBLANK, ISNUMBER, ISTEXT`;

const FORMATTING_SNIPPET = `import type { CellFormat, MergeRegion } from "@widgetkit/spreadsheet-react";

const formats: Record<string, CellFormat> = {
  A1: { bold: true, background: "#1e293b", color: "#ffffff" },
  B2: { italic: true, color: "#3b82f6" },
  C3: { numberFormat: "currency" },               // $1,234.56
  D4: { numberFormat: "percent", decimalPlaces: 1 }, // 42.0%
};

// A1 spans 3 columns
const merges: Record<string, MergeRegion> = {
  A1: { colSpan: 3, rowSpan: 1 },
};

<Spreadsheet
  cells={cells}
  formats={formats}
  merges={merges}
  onFormatsChange={setFormats}
  onMergesChange={setMerges}
/>`;

const IMPERATIVE_SNIPPET = `import { useRef } from "react";
import { Spreadsheet } from "@widgetkit/spreadsheet-react";
import type { SpreadsheetHandle } from "@widgetkit/spreadsheet-react";

export function App() {
  const ref = useRef<SpreadsheetHandle>(null);

  return (
    <>
      <button onClick={() => ref.current?.scrollToCell("Z50")}>Scroll to Z50</button>
      <button onClick={() => ref.current?.setSelection("B2")}>Select B2</button>
      <button onClick={() => ref.current?.startEdit("A1")}>Edit A1</button>
      <button onClick={() => console.log(ref.current?.exportCsv())}>Export CSV</button>

      <Spreadsheet ref={ref} defaultCells={{ A1: "Hello" }} />
    </>
  );
}`;

const LARGE_DATA_SNIPPET = `import { useState } from "react";
import { Spreadsheet } from "@widgetkit/spreadsheet-react";
import "@widgetkit/spreadsheet-react/styles.css";
import type { CellMap, CellFormat, MergeRegion } from "@widgetkit/spreadsheet-react";

const cells: CellMap = {
  A1: "Product Catalog — 2024",

  A2: "Product",    B2: "Category", C2: "Price", D2: "Units Sold",
  E2: "Revenue",    F2: "Cost",     G2: "Profit", H2: "Margin %",

  A3: "Pro Keyboard",    B3: "Hardware",  C3: 129, D3: 412,
  A4: "Wireless Mouse",  B4: "Hardware",  C4: 49,  D4: 873,
  A5: "Note-taking App", B5: "Software",  C5: 9,   D5: 3204,
  A6: "Task Manager",    B6: "Software",  C6: 12,  D6: 2871,
  // ...more rows

  // Revenue = Price × Units
  E3: "=C3*D3", E4: "=C4*D4", E5: "=C5*D5", E6: "=C6*D6",

  // Profit = Revenue − Cost
  G3: "=E3-F3", G4: "=E4-F4", G5: "=E5-F5", G6: "=E6-F6",

  // Margin % = Profit ÷ Revenue
  H3: "=G3/E3", H4: "=G4/E4", H5: "=G5/E5", H6: "=G6/E6",

  // Totals
  A7: "Totals",
  D7: "=SUM(D3:D6)", E7: "=SUM(E3:E6)",
  F7: "=SUM(F3:F6)", G7: "=SUM(G3:G6)",
  H7: "=G7/E7",
};

const formats: Record<string, CellFormat> = {
  A1: { bold: true, background: "#1e293b", color: "#ffffff" },
  A2: { bold: true, background: "#f1f5f9" },
  // ... header formatting for B2–H2

  C3: { numberFormat: "currency" },
  E3: { numberFormat: "currency" },
  G3: { numberFormat: "currency", color: "#16a34a" },
  H3: { numberFormat: "percent", decimalPlaces: 1 },
  // ... same for each row

  G7: { bold: true, numberFormat: "currency", color: "#16a34a", background: "#f0fdf4" },
  H7: { bold: true, numberFormat: "percent",  decimalPlaces: 1, color: "#16a34a", background: "#f0fdf4" },
};

const merges: Record<string, MergeRegion> = {
  A1: { colSpan: 8, rowSpan: 1 }, // title spans all columns
};

export function App() {
  const [currentCells,   setCurrentCells]   = useState<CellMap>(cells);
  const [currentFormats, setCurrentFormats] = useState(formats);
  const [currentMerges,  setCurrentMerges]  = useState(merges);

  return (
    <Spreadsheet
      cells={currentCells}
      formats={currentFormats}
      merges={currentMerges}
      rows={30}
      cols={10}
      maxHeight={420}
      autoExpandRows
      resizableCols
      onCellsChange={setCurrentCells}
      onFormatsChange={setCurrentFormats}
      onMergesChange={setCurrentMerges}
    />
  );
}`;

const KEYBOARD_SNIPPET = `Arrow keys          Navigate cells
Enter / Tab         Confirm edit, move to next cell
Escape              Cancel edit
F2                  Start editing selected cell
Delete / Backspace  Clear selected cell(s)
Ctrl+C / Ctrl+V     Copy / paste
Ctrl+X              Cut
Ctrl+Z / Ctrl+Y     Undo / redo
Ctrl+B / Ctrl+I     Bold / italic
Ctrl+Home / End     Jump to first / last cell
Page Up / Down      Scroll by page`;

const TYPES_SNIPPET = `type CellValue = string | number | null;
type CellMap  = Record<string, CellValue>;

type NumberFormat = 'general' | 'number' | 'currency' | 'percent' | 'date';

interface CellFormat {
  bold?:          boolean;
  italic?:        boolean;
  color?:         string;            // CSS color
  background?:    string;            // CSS color
  numberFormat?:  NumberFormat;
  decimalPlaces?: number;
}

interface MergeRegion {
  colSpan: number;
  rowSpan: number;
}

// Imperative handle — access via ref
interface SpreadsheetHandle {
  scrollToCell: (ref: string) => void;
  setSelection: (ref: string) => void;
  startEdit:    (ref: string) => void;
  exportCsv:    () => string;
  getCells:     () => CellMap;
}`;

const TYPES_IMPORT_SNIPPET = `import type {
  CellValue,
  CellMap,
  CellFormat,
  MergeRegion,
  NumberFormat,
  SpreadsheetHandle,
  SpreadsheetProps,
} from "@widgetkit/spreadsheet-react";`;

export default function SpreadsheetPage() {
  return (
    <>
      <nav className="nav">
        <a href="/" className="nav-logo">
          <span className="nav-logo-widget">Widget</span><span className="nav-logo-kit">Kit</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ThemeToggle />
          <a href="https://github.com/Sindreglo/widgetkit" target="_blank" rel="noopener noreferrer" className="theme-icon-btn" aria-label="GitHub">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
          </a>
          <a href="/#products" className="nav-cta">Explore widgets</a>
        </div>
      </nav>

      <div className="docs-layout">
        <Sidebar />

        <main className="docs-content">
          <div className="docs-page-header">
            <div className="docs-pkg-badges">
              <span className="docs-pkg-badge">@widgetkit/spreadsheet-react</span>
            </div>
            <h1 className="docs-page-title">Spreadsheet</h1>
            <p className="docs-page-desc">
              A lightweight spreadsheet with inline editing, formula evaluation,
              cell formatting, merges, and full keyboard navigation. Pass your
              data as a simple key-value map and receive updates via callbacks —
              no spreadsheet engine setup required.
            </p>
          </div>

          <section id="introduction" className="docs-section">
            <p className="docs-section-tag">Overview</p>
            <h2>Introduction</h2>
            <p>
              <code className="inline-code">Spreadsheet</code> renders an
              editable grid with A1-style cell references, formula evaluation,
              a formatting toolbar, and a formula bar. Works in both controlled
              and uncontrolled modes. Use the imperative API via{" "}
              <code className="inline-code">ref</code> to programmatically
              scroll, select, or export data.
            </p>
            <SpreadsheetDemo />
          </section>

          <section id="installation" className="docs-section">
            <p className="docs-section-tag">Setup</p>
            <h2>Getting started</h2>
            <GettingStartedSection />
          </section>

          <section id="controlled" className="docs-section">
            <p className="docs-section-tag">Example</p>
            <h2>Controlled mode</h2>
            <p>
              Pass <code className="inline-code">cells</code> and{" "}
              <code className="inline-code">onCellsChange</code> to keep your
              own state in sync with the grid. This is the recommended pattern
              when you need to persist data or react to changes externally.
              Use <code className="inline-code">defaultCells</code> instead for
              uncontrolled usage where you just need an initial value.
            </p>
            <CodeBlock code={CONTROLLED_SNIPPET} />
          </section>

          <section id="formulas" className="docs-section">
            <p className="docs-section-tag">Example</p>
            <h2>Formulas</h2>
            <p>
              Any cell value starting with{" "}
              <code className="inline-code">=</code> is evaluated as a formula.
              Formulas support cell references (<code className="inline-code">A1</code>),
              ranges (<code className="inline-code">A1:C3</code>), and a
              built-in function library across four categories.
            </p>
            <CodeBlock code={FORMULAS_SNIPPET} />
          </section>

          <section id="formatting" className="docs-section">
            <p className="docs-section-tag">Example</p>
            <h2>Formatting &amp; merges</h2>
            <p>
              Cell formatting is stored separately from cell values in a{" "}
              <code className="inline-code">Record&lt;string, CellFormat&gt;</code>.
              The toolbar writes to this map via{" "}
              <code className="inline-code">onFormatsChange</code>. You can
              also merge cells into a single region using{" "}
              <code className="inline-code">merges</code>.
            </p>
            <CodeBlock code={FORMATTING_SNIPPET} />
          </section>

          <section id="imperative-api" className="docs-section">
            <p className="docs-section-tag">Example</p>
            <h2>Imperative API</h2>
            <p>
              Pass a <code className="inline-code">ref</code> to access the
              imperative handle. Useful for programmatic navigation, focus
              management, or exporting data from outside the component.
            </p>
            <CodeBlock code={IMPERATIVE_SNIPPET} />
            <p style={{ marginTop: "1.5rem" }}>
              Built-in keyboard shortcuts:
            </p>
            <CodeBlock code={KEYBOARD_SNIPPET} compact />
          </section>

          <section id="large-dataset" className="docs-section">
            <p className="docs-section-tag">Example</p>
            <h2>Large dataset</h2>
            <p>
              A 14-row product catalog demonstrating formulas across multiple
              dependent columns, mixed number formats, conditional colors, a
              merged title cell, and a totals row — all driven by a flat{" "}
              <code className="inline-code">CellMap</code>.
            </p>
            <LargeDataDemo />
            <CodeBlock code={LARGE_DATA_SNIPPET} />
          </section>

          <section id="props" className="docs-section">
            <p className="docs-section-tag">Reference</p>
            <h2>Props</h2>
            <PropsTable />
          </section>

          <section id="types" className="docs-section">
            <p className="docs-section-tag">Reference</p>
            <h2>TypeScript types</h2>
            <p>
              All types are exported from{" "}
              <code className="inline-code">@widgetkit/spreadsheet-react</code>.
              Core types (<code className="inline-code">CellValue</code>,{" "}
              <code className="inline-code">CellMap</code>) are also available
              from <code className="inline-code">@widgetkit/spreadsheet</code>{" "}
              if you need them framework-agnostically.
            </p>
            <CodeBlock code={TYPES_IMPORT_SNIPPET} compact />
            <CodeBlock code={TYPES_SNIPPET} />
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
