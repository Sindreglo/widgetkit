import { describe, it, expect } from 'vitest';
import { assignSubRows } from './layout';
import type { TimelineItem } from './types';

function item(id: string, startH: number, endH: number): TimelineItem {
  const base = new Date(2024, 3, 13);
  const start = new Date(base); start.setHours(startH, 0, 0, 0);
  const end = new Date(base); end.setHours(endH, 0, 0, 0);
  return { id, resourceId: 'r1', name: id, color: '#000', start, end };
}

describe('assignSubRows', () => {
  it('returns empty map for empty input', () => {
    expect(assignSubRows([]).size).toBe(0);
  });

  it('assigns row 0 to a single item', () => {
    const map = assignSubRows([item('a', 9, 10)]);
    expect(map.get('a')).toBe(0);
  });

  it('assigns row 0 to non-overlapping items', () => {
    const map = assignSubRows([item('a', 9, 10), item('b', 10, 11)]);
    expect(map.get('a')).toBe(0);
    expect(map.get('b')).toBe(0);
  });

  it('assigns row 1 to overlapping item', () => {
    const map = assignSubRows([item('a', 9, 11), item('b', 10, 12)]);
    expect(map.get('a')).toBe(0);
    expect(map.get('b')).toBe(1);
  });

  it('packs 3 overlapping items into 3 rows', () => {
    const map = assignSubRows([item('a', 9, 12), item('b', 9, 12), item('c', 9, 12)]);
    const rows = [map.get('a'), map.get('b'), map.get('c')].sort();
    expect(rows).toEqual([0, 1, 2]);
  });

  it('reuses a row after an item ends', () => {
    const map = assignSubRows([item('a', 9, 10), item('b', 9, 11), item('c', 10, 11)]);
    // 'a' ends at 10; 'c' starts at 10 — should fit in row 0
    expect(map.get('c')).toBe(0);
  });
});
