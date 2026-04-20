import type { CardId, ColumnId, KanbanCard, KanbanColumn } from './types';

export function findCard(
  columns: KanbanColumn[],
  cardId: CardId,
): { card: KanbanCard; columnId: ColumnId; index: number } | null {
  for (const col of columns) {
    const idx = col.cards.findIndex(c => c.id === cardId);
    if (idx !== -1) return { card: col.cards[idx], columnId: col.id, index: idx };
  }
  return null;
}

export function moveCard(
  columns: KanbanColumn[],
  cardId: CardId,
  toColumnId: ColumnId,
  toIndex: number,
): KanbanColumn[] {
  const source = findCard(columns, cardId);
  if (!source) return columns;

  const withoutCard = columns.map(col =>
    col.id === source.columnId
      ? { ...col, cards: col.cards.filter(c => c.id !== cardId) }
      : col,
  );

  return withoutCard.map(col => {
    if (col.id !== toColumnId) return col;
    const cards = [...col.cards];
    cards.splice(Math.min(toIndex, cards.length), 0, source.card);
    return { ...col, cards };
  });
}

export function reorderColumns(
  columns: KanbanColumn[],
  fromIndex: number,
  toIndex: number,
): KanbanColumn[] {
  if (fromIndex === toIndex) return columns;
  const result = [...columns];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

export function addCard(
  columns: KanbanColumn[],
  columnId: ColumnId,
  card: KanbanCard,
  atIndex?: number,
): KanbanColumn[] {
  return columns.map(col => {
    if (col.id !== columnId) return col;
    const cards = [...col.cards];
    if (atIndex !== undefined) {
      cards.splice(Math.min(atIndex, cards.length), 0, card);
    } else {
      cards.push(card);
    }
    return { ...col, cards };
  });
}

export function deleteCard(columns: KanbanColumn[], cardId: CardId): KanbanColumn[] {
  return columns.map(col => ({
    ...col,
    cards: col.cards.filter(c => c.id !== cardId),
  }));
}

export function updateCard(
  columns: KanbanColumn[],
  cardId: CardId,
  updates: Partial<KanbanCard>,
): KanbanColumn[] {
  return columns.map(col => ({
    ...col,
    cards: col.cards.map(c => (c.id === cardId ? { ...c, ...updates } : c)),
  }));
}

export function addColumn(columns: KanbanColumn[], column: KanbanColumn): KanbanColumn[] {
  return [...columns, column];
}

export function deleteColumn(columns: KanbanColumn[], columnId: ColumnId): KanbanColumn[] {
  return columns.filter(col => col.id !== columnId);
}

export function updateColumn(
  columns: KanbanColumn[],
  columnId: ColumnId,
  updates: Partial<Omit<KanbanColumn, 'id'>>,
): KanbanColumn[] {
  return columns.map(col => (col.id === columnId ? { ...col, ...updates } : col));
}
