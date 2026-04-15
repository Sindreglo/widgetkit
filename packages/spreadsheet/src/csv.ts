import { CellMap, ComputedMap } from './types';
import { addressToRef } from './refs';

export function exportCsv(cells: CellMap, computed: ComputedMap, rows: number, cols: number): string {
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      const ref = addressToRef(c, r);
      const v = computed[ref] ?? cells[ref] ?? '';
      const s = String(v);
      row.push(/[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    }
    lines.push(row.join(','));
  }
  // Trim trailing blank rows
  while (lines.length && lines[lines.length - 1].replace(/,/g, '') === '') lines.pop();
  return lines.join('\n');
}
