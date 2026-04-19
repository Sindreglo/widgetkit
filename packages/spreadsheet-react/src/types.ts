import type { CellMap } from '@widgetkit/spreadsheet';

export type NumberFormat = 'general' | 'number' | 'currency' | 'percent' | 'date';

export interface MergeRegion {
  colSpan: number;
  rowSpan: number;
}

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  color?: string;
  background?: string;
  numberFormat?: NumberFormat;
  decimalPlaces?: number;
}

export interface SpreadsheetProps {
  cells: CellMap;
  rows?: number;
  cols?: number;
  colWidths?: Record<number, number>;
  rowHeight?: number;
  frozenRows?: number;
  frozenCols?: number;
  showFormulaBar?: boolean;
  showToolbar?: boolean;
  showRowNumbers?: boolean;
  showColHeaders?: boolean;
  readOnly?: boolean;
  maxHeight?: number;
  formats?: Record<string, CellFormat>;
  merges?: Record<string, MergeRegion>;
  onCellChange?: (ref: string, value: string | number | null) => void;
  onCellsChange?: (cells: CellMap) => void;
  onFormatsChange?: (formats: Record<string, CellFormat>) => void;
  onMergesChange?: (merges: Record<string, MergeRegion>) => void;
}
