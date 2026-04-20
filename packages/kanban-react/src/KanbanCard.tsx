import type { ReactNode } from 'react';
import type { KanbanCard } from '@widgetkit/kanban';

interface KanbanCardProps {
  card: KanbanCard;
  columnId: string;
  isDragging: boolean;
  readOnly: boolean;
  renderCard?: (card: KanbanCard, columnId: string) => ReactNode;
  onClick: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onDelete: () => void;
}

const PRIORITY_LABEL: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(iso: string): boolean {
  return new Date(iso) < new Date();
}

export function KanbanCardComponent({
  card,
  columnId,
  isDragging,
  readOnly,
  renderCard,
  onClick,
  onPointerDown,
  onDelete,
}: KanbanCardProps) {
  const cls = [
    'kn-card',
    isDragging ? 'kn-card--dragging' : '',
    card.priority ? `kn-card--priority-${card.priority}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (renderCard) {
    return (
      <div
        className={cls}
        data-kn-card-id={card.id}
        onPointerDown={readOnly ? undefined : onPointerDown}
        onClick={onClick}
      >
        {renderCard(card, columnId)}
      </div>
    );
  }

  return (
    <div
      className={cls}
      data-kn-card-id={card.id}
      onPointerDown={readOnly ? undefined : onPointerDown}
      onClick={onClick}
    >
      {card.labels && card.labels.length > 0 && (
        <div className="kn-card-labels">
          {card.labels.map((label, i) => (
            <span key={i} className={`kn-label kn-label--${label.color}`}>
              {label.text}
            </span>
          ))}
        </div>
      )}

      <div className="kn-card-title">{card.title}</div>

      {card.description && (
        <div className="kn-card-desc">{card.description}</div>
      )}

      {(card.priority || card.dueDate || !readOnly) && (
        <div className="kn-card-meta">
          {card.priority && (
            <span className={`kn-card-priority kn-card-priority--${card.priority}`}>
              {PRIORITY_LABEL[card.priority]}
            </span>
          )}
          {card.dueDate && (
            <span className={`kn-card-due${isOverdue(card.dueDate) ? ' kn-card-due--overdue' : ''}`}>
              📅 {formatDate(card.dueDate)}
            </span>
          )}
          {!readOnly && (
            <button
              className="kn-card-delete-btn"
              onClick={e => { e.stopPropagation(); onDelete(); }}
              aria-label="Delete card"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}
