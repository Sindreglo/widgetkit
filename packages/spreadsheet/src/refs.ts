import type { CellAddress } from './types';

export function colToLetters(col: number): string {
  let result = '';
  let c = col + 1;
  while (c > 0) {
    const rem = (c - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    c = Math.floor((c - 1) / 26);
  }
  return result;
}

export function lettersToCol(letters: string): number {
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return col - 1;
}

export function refToAddress(ref: string): CellAddress | null {
  const m = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!m) return null;
  return { col: lettersToCol(m[1].toUpperCase()), row: parseInt(m[2], 10) - 1 };
}

export function addressToRef(col: number, row: number): string {
  return `${colToLetters(col)}${row + 1}`;
}

export function expandRange(rangeStr: string): string[] {
  const m = rangeStr.match(/^([A-Z]+\d+):([A-Z]+\d+)$/i);
  if (!m) return [];
  const start = refToAddress(m[1]);
  const end = refToAddress(m[2]);
  if (!start || !end) return [];
  const cells: string[] = [];
  for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
    for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
      cells.push(addressToRef(c, r));
    }
  }
  return cells;
}
