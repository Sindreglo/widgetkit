import type { TimelineItem } from './types';

export function assignSubRows(items: TimelineItem[]): Map<string, number> {
  const result = new Map<string, number>();
  if (items.length === 0) return result;

  const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());
  const subRowEnds: number[] = [];

  for (const item of sorted) {
    let placed = false;
    for (let row = 0; row < subRowEnds.length; row++) {
      if (subRowEnds[row] <= item.start.getTime()) {
        result.set(item.id, row);
        subRowEnds[row] = item.end.getTime();
        placed = true;
        break;
      }
    }
    if (!placed) {
      result.set(item.id, subRowEnds.length);
      subRowEnds.push(item.end.getTime());
    }
  }

  return result;
}
