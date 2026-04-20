import type { CellMap, CellValue } from './types';
import { colToLetters } from './refs';

export function toCellValue(raw: string): CellValue {
  if (raw === '') return null;
  if (raw.startsWith('=')) return raw;
  const n = Number(raw);
  if (!isNaN(n) && raw.trim() !== '') return n;
  return raw;
}

export function shiftRows(cells: CellMap, fromRow: number, delta: number): CellMap {
  const out: CellMap = {};
  for (const [ref, val] of Object.entries(cells)) {
    const m = ref.match(/^([A-Z]+)(\d+)$/i);
    if (!m) { out[ref] = val; continue; }
    const r = parseInt(m[2], 10) - 1;
    if (delta < 0 && r === fromRow) continue;
    out[r < fromRow ? ref : `${m[1]}${r + delta + 1}`] = val;
  }
  return out;
}

export function shiftCols(cells: CellMap, fromCol: number, delta: number): CellMap {
  const out: CellMap = {};
  for (const [ref, val] of Object.entries(cells)) {
    const m = ref.match(/^([A-Z]+)(\d+)$/i);
    if (!m) { out[ref] = val; continue; }
    let c = 0;
    for (const ch of m[1].toUpperCase()) c = c * 26 + (ch.charCodeAt(0) - 64);
    c--;
    if (delta < 0 && c === fromCol) continue;
    out[c < fromCol ? ref : `${colToLetters(c + delta)}${m[2]}`] = val;
  }
  return out;
}
