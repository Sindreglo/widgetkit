export type CellValue = string | number | boolean | null;
export type CellMap = Record<string, CellValue>;
export type ComputedMap = Record<string, CellValue | SpreadsheetError>;

export const ERRORS = {
  REF:   '#REF!'   as const,
  DIV0:  '#DIV/0!' as const,
  NAME:  '#NAME?'  as const,
  CIRC:  '#CIRC!'  as const,
  VALUE: '#VALUE!' as const,
} as const;

export type SpreadsheetError = typeof ERRORS[keyof typeof ERRORS];

export function isError(v: unknown): v is SpreadsheetError {
  return typeof v === 'string' && v.startsWith('#');
}

export interface CellAddress { col: number; row: number; }
