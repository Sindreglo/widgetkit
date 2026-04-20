export type CardId = string;
export type ColumnId = string;
export type Priority = 'low' | 'medium' | 'high';
export type LabelColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'gray';

export interface KanbanLabel {
  text: string;
  color: LabelColor;
}

export interface KanbanCard {
  id: CardId;
  title: string;
  description?: string;
  labels?: KanbanLabel[];
  dueDate?: string;
  priority?: Priority;
}

export interface KanbanColumn {
  id: ColumnId;
  title: string;
  cards: KanbanCard[];
}
