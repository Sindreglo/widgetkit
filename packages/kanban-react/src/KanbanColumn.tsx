import type { ReactNode } from 'react';
import type { KanbanCard, KanbanColumn } from '@widgetkit/kanban';
import { KanbanCardComponent } from './KanbanCard';

interface KanbanColumnProps {
  column: KanbanColumn;
  isDragging: boolean;
  draggingCardId: string | null;
  dropTarget: number | null;
  showAddCard: boolean;
  isAddingCard: boolean;
  newCardTitle: string;
  readOnly: boolean;
  renderCard?: (card: KanbanCard, columnId: string) => ReactNode;
  onStartAddCard: () => void;
  onNewCardTitleChange: (value: string) => void;
  onAddCard: () => void;
  onCancelAddCard: () => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteColumn: () => void;
  onCardClick: (card: KanbanCard) => void;
  onCardPointerDown: (e: React.PointerEvent, cardId: string) => void;
  onColumnHeaderPointerDown: (e: React.PointerEvent) => void;
}

export function KanbanColumnComponent({
  column,
  isDragging,
  draggingCardId,
  dropTarget,
  showAddCard,
  isAddingCard,
  newCardTitle,
  readOnly,
  renderCard,
  onStartAddCard,
  onNewCardTitleChange,
  onAddCard,
  onCancelAddCard,
  onDeleteCard,
  onDeleteColumn,
  onCardClick,
  onCardPointerDown,
  onColumnHeaderPointerDown,
}: KanbanColumnProps) {
  return (
    <div
      className={`kn-column${isDragging ? ' kn-column--dragging' : ''}`}
      data-kn-column-id={column.id}
    >
      <div className="kn-column-header" onPointerDown={onColumnHeaderPointerDown}>
        <div className="kn-column-header-left">
          <span className="kn-column-title">{column.title}</span>
          <span className="kn-column-count">{column.cards.length}</span>
        </div>
        {!readOnly && (
          <button
            className="kn-column-delete-btn"
            onClick={e => { e.stopPropagation(); onDeleteColumn(); }}
            aria-label={`Delete column ${column.title}`}
          >
            ×
          </button>
        )}
      </div>

      <div className="kn-column-cards">
        {column.cards.map((card, cardIndex) => (
          <div key={card.id} style={{ display: 'contents' }}>
            {dropTarget === cardIndex && <div className="kn-card-drop-indicator" />}
            <KanbanCardComponent
              card={card}
              columnId={column.id}
              isDragging={card.id === draggingCardId}
              readOnly={readOnly}
              renderCard={renderCard}
              onClick={() => onCardClick(card)}
              onPointerDown={e => onCardPointerDown(e, card.id)}
              onDelete={() => onDeleteCard(card.id)}
            />
          </div>
        ))}
        {dropTarget === column.cards.length && <div className="kn-card-drop-indicator" />}

        {isAddingCard ? (
          <div className="kn-add-card-form">
            <textarea
              className="kn-input kn-add-card-input"
              autoFocus
              placeholder="Card title"
              value={newCardTitle}
              onChange={e => onNewCardTitleChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAddCard(); }
                if (e.key === 'Escape') onCancelAddCard();
              }}
              rows={2}
            />
            <div className="kn-add-card-actions">
              <button className="kn-btn kn-btn--primary" onClick={onAddCard}>Add card</button>
              <button className="kn-btn" onClick={onCancelAddCard}>Cancel</button>
            </div>
          </div>
        ) : showAddCard ? (
          <button className="kn-add-card-btn" onClick={onStartAddCard}>+ Add card</button>
        ) : null}
      </div>
    </div>
  );
}
