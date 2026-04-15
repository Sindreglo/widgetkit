import type { CellMap } from '@widgetkit/spreadsheet';

export interface SpreadsheetProps {
  cells: CellMap;
  rows?: number;
  cols?: number;
  colWidths?: Record<number, number>;  // col index → px width
  rowHeight?: number;
  frozenRows?: number;
  frozenCols?: number;
  showFormulaBar?: boolean;
  showRowNumbers?: boolean;
  showColHeaders?: boolean;
  readOnly?: boolean;
  maxHeight?: number;
  onCellChange?: (ref: string, value: string | number | null) => void;
  onCellsChange?: (cells: CellMap) => void;
}
