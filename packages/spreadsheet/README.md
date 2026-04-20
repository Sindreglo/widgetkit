# @widgetkit/spreadsheet

Framework-agnostic spreadsheet core for WidgetKit. Provides a formula engine, cell evaluation, reference utilities, and CSV export — usable from any UI framework or plain JavaScript.

## Installation

```bash
npm install @widgetkit/spreadsheet
# or
pnpm add @widgetkit/spreadsheet
# or
yarn add @widgetkit/spreadsheet
```

## Usage

### Evaluate cells with formulas

```ts
import { evaluate } from "@widgetkit/spreadsheet";

const cells = {
  A1: 10,
  A2: 20,
  A3: "=SUM(A1:A2)",
  B1: "=IF(A3>25, \"High\", \"Low\")",
};

const computed = evaluate(cells);
// { A1: 10, A2: 20, A3: 30, B1: "High" }
```

### Export to CSV

```ts
import { evaluate, exportCsv } from "@widgetkit/spreadsheet";

const cells = { A1: "Name", B1: "Score", A2: "Alice", B2: 95 };
const computed = evaluate(cells);
const csv = exportCsv(cells, computed, 2, 2);
// "Name,Score\nAlice,95"
```

### Cell reference utilities

```ts
import { addressToRef, refToAddress, colToLetters, expandRange } from "@widgetkit/spreadsheet";

addressToRef(0, 0)   // "A1"
addressToRef(2, 4)   // "C5"
refToAddress("B3")   // { col: 1, row: 2 }
colToLetters(25)     // "Z"
colToLetters(26)     // "AA"
expandRange("A1:B2") // ["A1", "B1", "A2", "B2"]
```

### Cell data helpers

```ts
import { toCellValue, shiftRows, shiftCols } from "@widgetkit/spreadsheet";

// Parse a raw string input into a typed CellValue
toCellValue("42")       // 42
toCellValue("hello")    // "hello"
toCellValue("=SUM(A1)") // "=SUM(A1)"
toCellValue("")         // null

// Insert a row above row index 2 (0-based)
const updated = shiftRows(cells, 2, 1);

// Delete column index 1
const updated = shiftCols(cells, 1, -1);
```

---

## API

### `evaluate(cells)`

Evaluates all cells, resolving formulas in dependency order. Detects and marks circular references.

```ts
function evaluate(cells: CellMap): ComputedMap;
```

Returns a `ComputedMap` where formula cells are replaced with their computed values (or error strings like `#REF!`).

### `evaluateFormula(formula, cells)`

Evaluates a single formula string against a cell map.

```ts
function evaluateFormula(formula: string, cells: CellMap): CellValue | SpreadsheetError;
```

### `exportCsv(cells, computed, rows, cols)`

Serializes computed cell values to a CSV string.

```ts
function exportCsv(cells: CellMap, computed: ComputedMap, rows: number, cols: number): string;
```

### `isError(value)`

Type guard that returns `true` if the value is a spreadsheet error string.

```ts
function isError(v: unknown): v is SpreadsheetError;
```

### `toCellValue(raw)`

Converts a raw string (e.g. from an input element) to a typed `CellValue`.

```ts
function toCellValue(raw: string): CellValue;
// "" → null | "42" → 42 | "=SUM(A1)" → "=SUM(A1)" | "hello" → "hello"
```

### `shiftRows(cells, fromRow, delta)`

Returns a new `CellMap` with all rows at or after `fromRow` shifted by `delta`. Pass `delta = 1` to insert a row, `delta = -1` to delete. Row indices are 0-based.

```ts
function shiftRows(cells: CellMap, fromRow: number, delta: number): CellMap;
```

### `shiftCols(cells, fromCol, delta)`

Returns a new `CellMap` with all columns at or after `fromCol` shifted by `delta`. Column indices are 0-based.

```ts
function shiftCols(cells: CellMap, fromCol: number, delta: number): CellMap;
```

### Reference utilities

| Function | Signature | Description |
| --- | --- | --- |
| `addressToRef` | `(col: number, row: number) => string` | Convert 0-based indices to a cell ref (`"A1"`). |
| `refToAddress` | `(ref: string) => CellAddress \| null` | Parse a cell ref to `{ col, row }` indices. |
| `colToLetters` | `(col: number) => string` | Convert a 0-based column index to letters (`0 → "A"`, `26 → "AA"`). |
| `lettersToCol` | `(letters: string) => number` | Convert column letters to a 0-based index. |
| `expandRange` | `(range: string) => string[]` | Expand a range like `"A1:C3"` to all cell refs it contains. |
| `extractDeps`  | `(formula: string) => string[]` | Return all cell refs a formula depends on. |

---

## Supported formulas

| Category | Functions |
| --- | --- |
| Math | `SUM`, `AVERAGE`, `MIN`, `MAX`, `ABS`, `ROUND`, `FLOOR`, `CEILING`, `SQRT`, `POWER`, `MOD` |
| Logic | `IF`, `AND`, `OR`, `NOT`, `IFERROR` |
| Text | `CONCAT`, `LEN`, `UPPER`, `LOWER`, `TRIM`, `LEFT`, `RIGHT`, `MID` |
| Info | `ISBLANK`, `ISNUMBER`, `ISTEXT` |
| Operators | `+`, `-`, `*`, `/`, `^`, `=`, `<>`, `<`, `>`, `<=`, `>=`, `&` |
| Ranges | `A1:B3` syntax supported in all aggregate functions |

---

## Types

```ts
type CellValue = string | number | boolean | null;
type CellMap = Record<string, CellValue>;
type ComputedMap = Record<string, CellValue | SpreadsheetError>;

type SpreadsheetError =
  | "#REF!"   // Invalid reference
  | "#DIV/0!" // Division by zero
  | "#NAME?"  // Unknown function
  | "#CIRC!"  // Circular reference
  | "#VALUE!" // Wrong value type

interface CellAddress {
  col: number; // 0-based column index
  row: number; // 0-based row index
}

const ERRORS: {
  REF:   "#REF!";
  DIV0:  "#DIV/0!";
  NAME:  "#NAME?";
  CIRC:  "#CIRC!";
  VALUE: "#VALUE!";
};
```
