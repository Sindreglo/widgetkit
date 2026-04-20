import type { ReactNode } from 'react';
import type { CardId, ColumnId, KanbanCard, KanbanColumn } from '@widgetkit/kanban';

export interface KanbanProps {
  columns?: KanbanColumn[];
  onColumnsChange?: (columns: KanbanColumn[]) => void;
  defaultColumns?: KanbanColumn[];

  onCardMove?: (cardId: CardId, fromColumnId: ColumnId, toColumnId: ColumnId, newIndex: number) => void;
  onCardClick?: (card: KanbanCard, columnId: ColumnId) => void;
  onCardCreate?: (card: KanbanCard, columnId: ColumnId) => void;
  onCardDelete?: (cardId: CardId, columnId: ColumnId) => void;
  onColumnReorder?: (columnId: ColumnId, newIndex: number) => void;
  onColumnCreate?: (column: KanbanColumn) => void;
  onColumnDelete?: (columnId: ColumnId) => void;

  showCardModal?: boolean;
  showAddCard?: boolean;
  showAddColumn?: boolean;
  maxHeight?: number | string;
  readOnly?: boolean;

  enableDarkMode?: boolean;
  renderCard?: (card: KanbanCard, columnId: ColumnId) => ReactNode;
  'aria-label'?: string;
}

export interface KanbanHandle {
  scrollToCard: (cardId: CardId) => void;
  openCard: (cardId: CardId) => void;
}
