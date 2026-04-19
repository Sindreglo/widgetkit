import type { CSSProperties, ReactNode, MouseEvent } from 'react';
import type { CellMap, CellValue } from '@widgetkit/spreadsheet';

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

export interface ContextMenuItem {
  label: string;
  action: (anchorRef: string) => void;
  disabled?: boolean;
}

export interface SpreadsheetHandle {
  scrollToCell: (ref: string) => void;
  setSelection: (ref: string) => void;
  startEdit: (ref: string) => void;
  exportCsv: () => string;
  getCells: () => CellMap;
}

export interface SpreadsheetProps {
  // Data
  cells: CellMap;
  formats?: Record<string, CellFormat>;
  merges?: Record<string, MergeRegion>;

  // Grid dimensions
  rows?: number;
  cols?: number;
  rowHeight?: number;
  defaultColWidth?: number;
  colWidths?: Record<number, number>;

  // Layout / container sizing
  width?: number | string;
  height?: number | string;
  maxHeight?: number;
  className?: string;
  style?: CSSProperties;

  // UI visibility
  showFormulaBar?: boolean;
  showToolbar?: boolean;
  showRowNumbers?: boolean;
  showColHeaders?: boolean;
  showContextMenu?: boolean;

  // Feature flags
  readOnly?: boolean;
  resizableCols?: boolean;
  resizableRows?: boolean;
  selectionMode?: 'single' | 'range';
  frozenRows?: number;
  frozenCols?: number;
  autoExpandRows?: boolean;
  autoExpandCols?: boolean;
  expandRowsBy?: number;
  expandColsBy?: number;

  // Custom rendering
  renderCell?: (ref: string, value: CellValue, format?: CellFormat) => ReactNode;

  // Editing hooks
  onBeforeEdit?: (ref: string, currentValue: CellValue) => boolean;
  onValidate?: (ref: string, newValue: CellValue) => string | null;

  // Cell events
  onCellClick?: (ref: string, value: CellValue, event: MouseEvent) => void;
  onCellDoubleClick?: (ref: string, value: CellValue, event: MouseEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;

  // Data callbacks
  onSelectionChange?: (ref: string) => void;
  onCellChange?: (ref: string, value: string | number | null) => void;
  onCellsChange?: (cells: CellMap) => void;
  onFormatsChange?: (formats: Record<string, CellFormat>) => void;
  onMergesChange?: (merges: Record<string, MergeRegion>) => void;

  // Context menu extension
  contextMenuItems?: Array<ContextMenuItem | null>;

  // Accessibility
  'aria-label'?: string;
}
