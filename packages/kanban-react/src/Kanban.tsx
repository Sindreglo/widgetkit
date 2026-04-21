import {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import type { KanbanProps, KanbanHandle } from './types';
import type { KanbanCard, KanbanColumn as KanbanColumnType } from '@widgetkit/kanban';
import {
  moveCard,
  reorderColumns,
  addCard,
  deleteCard,
  updateCard,
  addColumn,
  deleteColumn,
  findCard,
  generateId,
} from '@widgetkit/kanban';
import { icons } from '@widgetkit/core';
import { KanbanColumnComponent } from './KanbanColumn';
import { CardModal } from './CardModal';

interface DragState {
  type: 'card' | 'column';
  id: string;
  fromColumnId?: string;
  fromIndex: number;
  ghostEl: HTMLElement | null;
  offsetX: number;
  offsetY: number;
  started: boolean;
  startX: number;
  startY: number;
}

function createGhost(sourceEl: HTMLElement, x: number, y: number, w: number): HTMLElement {
  const ghost = sourceEl.cloneNode(true) as HTMLElement;
  ghost.setAttribute('data-kn-ghost', '');
  ghost.style.cssText = [
    'position:fixed',
    `left:${x}px`,
    `top:${y}px`,
    `width:${w}px`,
    'pointer-events:none',
    'z-index:9999',
    'opacity:0.95',
    'transform:rotate(1.5deg) scale(1.02)',
    'box-shadow:0 8px 24px rgba(0,0,0,0.18)',
    'transition:none',
    'overflow:hidden',
  ].join(';');
  document.body.appendChild(ghost);
  return ghost;
}

export const Kanban = forwardRef<KanbanHandle, KanbanProps>((props, ref) => {
  const {
    columns: controlledColumns,
    defaultColumns,
    onColumnsChange,
    onCardMove,
    onCardClick,
    onCardCreate,
    onCardDelete,
    onColumnReorder,
    onColumnCreate,
    onColumnDelete,
    showCardModal = true,
    showAddCard = true,
    showAddColumn = true,
    enableDarkMode = true,
    maxHeight,
    readOnly = false,
    renderCard,
  } = props;

  const isControlled = controlledColumns !== undefined;
  const [internalColumns, setInternalColumns] = useState<KanbanColumnType[]>(
    defaultColumns ?? [],
  );
  const columns = isControlled ? controlledColumns! : internalColumns;

  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const applyChange = useCallback(
    (next: KanbanColumnType[]) => {
      if (!isControlled) setInternalColumns(next);
      onColumnsChange?.(next);
    },
    [isControlled, onColumnsChange],
  );

  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [dropTarget, setDropTarget] = useState<{ columnId: string; index: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [columnDropIndex, setColumnDropIndex] = useState<number | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const moveHandlerRef = useRef<((e: PointerEvent) => void) | null>(null);
  const upHandlerRef = useRef<((e: PointerEvent) => void) | null>(null);
  const dragOccurredRef = useRef(false);

  useImperativeHandle(ref, () => ({
    scrollToCard(cardId) {
      boardRef.current
        ?.querySelector(`[data-kn-card-id="${cardId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    },
    openCard(cardId) {
      setOpenCardId(cardId);
    },
  }));

  useEffect(() => {
    return () => {
      dragRef.current?.ghostEl?.remove();
      if (moveHandlerRef.current)
        document.removeEventListener('pointermove', moveHandlerRef.current);
      if (upHandlerRef.current)
        document.removeEventListener('pointerup', upHandlerRef.current);
    };
  }, []);

  const stopDrag = useCallback(() => {
    if (moveHandlerRef.current) {
      document.removeEventListener('pointermove', moveHandlerRef.current);
      moveHandlerRef.current = null;
    }
    if (upHandlerRef.current) {
      document.removeEventListener('pointerup', upHandlerRef.current);
      upHandlerRef.current = null;
    }
    dragRef.current?.ghostEl?.remove();
    dragRef.current = null;
  }, []);

  const startCardDrag = useCallback(
    (e: React.PointerEvent, cardId: string, columnId: string) => {
      if (readOnly || e.button !== 0) return;

      const cardEl = e.currentTarget as HTMLElement;
      const rect = cardEl.getBoundingClientRect();
      const fromIndex =
        columnsRef.current
          .find(c => c.id === columnId)
          ?.cards.findIndex(c => c.id === cardId) ?? 0;

      dragRef.current = {
        type: 'card',
        id: cardId,
        fromColumnId: columnId,
        fromIndex,
        ghostEl: null,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        started: false,
        startX: e.clientX,
        startY: e.clientY,
      };

      moveHandlerRef.current = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;

        if (!drag.started) {
          if (
            Math.abs(ev.clientX - drag.startX) < 5 &&
            Math.abs(ev.clientY - drag.startY) < 5
          )
            return;
          drag.started = true;
          dragOccurredRef.current = true;
          drag.ghostEl = createGhost(cardEl, rect.left, rect.top, rect.width);
          setDraggingId(cardId);
        }

        if (!drag.ghostEl) return;
        drag.ghostEl.style.left = `${ev.clientX - drag.offsetX}px`;
        drag.ghostEl.style.top = `${ev.clientY - drag.offsetY}px`;

        const els = document.elementsFromPoint(ev.clientX, ev.clientY);
        let targetColumnId: string | null = null;
        for (const el of els) {
          const id = (el as HTMLElement).dataset.knColumnId;
          if (id) { targetColumnId = id; break; }
        }
        if (!targetColumnId) { setDropTarget(null); return; }

        const col = columnsRef.current.find(c => c.id === targetColumnId);
        if (!col) return;

        const cardEls = boardRef.current?.querySelectorAll(
          `[data-kn-column-id="${targetColumnId}"] [data-kn-card-id]`,
        );
        let insertIndex = col.cards.length;
        if (cardEls) {
          for (let i = 0; i < cardEls.length; i++) {
            const r = (cardEls[i] as HTMLElement).getBoundingClientRect();
            if (ev.clientY < r.top + r.height / 2) { insertIndex = i; break; }
          }
        }
        setDropTarget({ columnId: targetColumnId, index: insertIndex });
      };

      upHandlerRef.current = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) { stopDrag(); return; }

        if (drag.started) {
          const els = document.elementsFromPoint(ev.clientX, ev.clientY);
          let targetColumnId: string | null = null;
          for (const el of els) {
            const id = (el as HTMLElement).dataset.knColumnId;
            if (id) { targetColumnId = id; break; }
          }

          if (targetColumnId) {
            const col = columnsRef.current.find(c => c.id === targetColumnId);
            const cardEls = boardRef.current?.querySelectorAll(
              `[data-kn-column-id="${targetColumnId}"] [data-kn-card-id]`,
            );
            let insertIndex = col?.cards.length ?? 0;
            if (cardEls) {
              for (let i = 0; i < cardEls.length; i++) {
                const r = (cardEls[i] as HTMLElement).getBoundingClientRect();
                if (ev.clientY < r.top + r.height / 2) { insertIndex = i; break; }
              }
            }
            const next = moveCard(columnsRef.current, drag.id, targetColumnId, insertIndex);
            applyChange(next);
            onCardMove?.(drag.id, drag.fromColumnId!, targetColumnId, insertIndex);
          }
        }

        setDraggingId(null);
        setDropTarget(null);
        stopDrag();
      };

      document.addEventListener('pointermove', moveHandlerRef.current);
      document.addEventListener('pointerup', upHandlerRef.current);
    },
    [readOnly, applyChange, onCardMove, stopDrag],
  );

  const startColumnDrag = useCallback(
    (e: React.PointerEvent, columnId: string) => {
      if (readOnly || e.button !== 0) return;

      const colEl = (e.currentTarget as HTMLElement).closest(
        '[data-kn-column-id]',
      ) as HTMLElement;
      if (!colEl) return;
      const rect = colEl.getBoundingClientRect();
      const fromIndex = columnsRef.current.findIndex(c => c.id === columnId);

      dragRef.current = {
        type: 'column',
        id: columnId,
        fromIndex,
        ghostEl: null,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        started: false,
        startX: e.clientX,
        startY: e.clientY,
      };

      moveHandlerRef.current = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;

        if (!drag.started) {
          if (
            Math.abs(ev.clientX - drag.startX) < 5 &&
            Math.abs(ev.clientY - drag.startY) < 5
          )
            return;
          drag.started = true;
          drag.ghostEl = createGhost(colEl, rect.left, rect.top, rect.width);
          drag.ghostEl.style.height = `${rect.height}px`;
          setDraggingColumnId(columnId);
        }

        if (!drag.ghostEl) return;
        drag.ghostEl.style.left = `${ev.clientX - drag.offsetX}px`;
        drag.ghostEl.style.top = `${ev.clientY - drag.offsetY}px`;

        const colEls = boardRef.current?.querySelectorAll('[data-kn-column-id]');
        if (!colEls) return;
        let insertIndex = columnsRef.current.length;
        for (let i = 0; i < colEls.length; i++) {
          const r = (colEls[i] as HTMLElement).getBoundingClientRect();
          if (ev.clientX < r.left + r.width / 2) { insertIndex = i; break; }
        }
        setColumnDropIndex(insertIndex);
      };

      upHandlerRef.current = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) { stopDrag(); return; }

        if (drag.started) {
          const colEls = boardRef.current?.querySelectorAll('[data-kn-column-id]');
          let insertIndex = columnsRef.current.length;
          if (colEls) {
            for (let i = 0; i < colEls.length; i++) {
              const r = (colEls[i] as HTMLElement).getBoundingClientRect();
              if (ev.clientX < r.left + r.width / 2) { insertIndex = i; break; }
            }
          }
          const adjustedIndex =
            insertIndex > drag.fromIndex ? insertIndex - 1 : insertIndex;
          if (adjustedIndex !== drag.fromIndex) {
            const next = reorderColumns(columnsRef.current, drag.fromIndex, adjustedIndex);
            applyChange(next);
            onColumnReorder?.(drag.id, adjustedIndex);
          }
        }

        setDraggingColumnId(null);
        setColumnDropIndex(null);
        stopDrag();
      };

      document.addEventListener('pointermove', moveHandlerRef.current);
      document.addEventListener('pointerup', upHandlerRef.current);
    },
    [readOnly, applyChange, onColumnReorder, stopDrag],
  );

  const handleAddCard = useCallback(
    (columnId: string) => {
      if (!newCardTitle.trim()) { setAddingToColumn(null); return; }
      const card: KanbanCard = { id: generateId(), title: newCardTitle.trim() };
      applyChange(addCard(columns, columnId, card));
      onCardCreate?.(card, columnId);
      setNewCardTitle('');
      setAddingToColumn(null);
    },
    [columns, newCardTitle, applyChange, onCardCreate],
  );

  const handleDeleteCard = useCallback(
    (cardId: string, columnId: string) => {
      applyChange(deleteCard(columns, cardId));
      onCardDelete?.(cardId, columnId);
      if (openCardId === cardId) setOpenCardId(null);
    },
    [columns, applyChange, onCardDelete, openCardId],
  );

  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      applyChange(deleteColumn(columns, columnId));
      onColumnDelete?.(columnId);
    },
    [columns, applyChange, onColumnDelete],
  );

  const handleUpdateCard = useCallback(
    (cardId: string, updates: Partial<KanbanCard>) => {
      applyChange(updateCard(columns, cardId, updates));
    },
    [columns, applyChange],
  );

  const handleAddColumn = useCallback(() => {
    if (!newColumnTitle.trim()) { setAddingColumn(false); return; }
    const col: KanbanColumnType = {
      id: generateId(),
      title: newColumnTitle.trim(),
      cards: [],
    };
    applyChange(addColumn(columns, col));
    onColumnCreate?.(col);
    setNewColumnTitle('');
    setAddingColumn(false);
  }, [columns, newColumnTitle, applyChange, onColumnCreate]);

  const openedCardData = openCardId ? findCard(columns, openCardId) : null;

  return (
    <div
      className={`kn-board${enableDarkMode ? '' : ' kn-board--light'}`}
      ref={boardRef}
      style={maxHeight ? { height: maxHeight, overflow: 'hidden' } : undefined}
      aria-label={props['aria-label']}
    >
      <div className="kn-board-scroll">
        {columns.map((col, colIndex) => (
          <div key={col.id} style={{ display: 'contents' }}>
            {columnDropIndex === colIndex && draggingColumnId && (
              <div className="kn-column-drop-indicator" />
            )}
            <KanbanColumnComponent
              column={col}
              isDragging={col.id === draggingColumnId}
              draggingCardId={draggingId}
              dropTarget={dropTarget?.columnId === col.id ? dropTarget.index : null}
              showAddCard={showAddCard && !readOnly}
              isAddingCard={addingToColumn === col.id}
              newCardTitle={addingToColumn === col.id ? newCardTitle : ''}
              readOnly={readOnly}
              renderCard={renderCard}
              onStartAddCard={() => setAddingToColumn(col.id)}
              onNewCardTitleChange={setNewCardTitle}
              onAddCard={() => handleAddCard(col.id)}
              onCancelAddCard={() => { setAddingToColumn(null); setNewCardTitle(''); }}
              onDeleteCard={cardId => handleDeleteCard(cardId, col.id)}
              onDeleteColumn={() => handleDeleteColumn(col.id)}
              onCardClick={card => {
                if (dragOccurredRef.current) {
                  dragOccurredRef.current = false;
                  return;
                }
                if (showCardModal) setOpenCardId(card.id);
                onCardClick?.(card, col.id);
              }}
              onCardPointerDown={(e, cardId) => startCardDrag(e, cardId, col.id)}
              onColumnHeaderPointerDown={e => startColumnDrag(e, col.id)}
            />
          </div>
        ))}
        {columnDropIndex === columns.length && draggingColumnId && (
          <div className="kn-column-drop-indicator" />
        )}

        {showAddColumn && !readOnly && (
          <div className="kn-add-column">
            {addingColumn ? (
              <div className="kn-add-column-form">
                <input
                  className="kn-input"
                  autoFocus
                  placeholder="Column title"
                  value={newColumnTitle}
                  onChange={e => setNewColumnTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddColumn();
                    if (e.key === 'Escape') { setAddingColumn(false); setNewColumnTitle(''); }
                  }}
                />
                <div className="kn-add-column-actions">
                  <button className="kn-btn kn-btn--primary" onClick={handleAddColumn}>
                    Add
                  </button>
                  <button
                    className="kn-btn"
                    onClick={() => { setAddingColumn(false); setNewColumnTitle(''); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className="kn-add-column-btn" onClick={() => setAddingColumn(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: icons.plus }} />
                Add column
              </button>
            )}
          </div>
        )}
      </div>

      {showCardModal && openedCardData && (
        <CardModal
          card={openedCardData.card}
          onClose={() => setOpenCardId(null)}
          onUpdate={updates => handleUpdateCard(openedCardData.card.id, updates)}
          onDelete={() => handleDeleteCard(openedCardData.card.id, openedCardData.columnId)}
        />
      )}
    </div>
  );
});

Kanban.displayName = 'Kanban';
