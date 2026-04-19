import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  evaluate,
  colToLetters,
  addressToRef,
  isError,
  exportCsv,
  type CellMap,
  type CellValue,
} from '@widgetkit/spreadsheet';
import type { SpreadsheetProps } from './types';

const DEFAULT_ROWS = 50;
const DEFAULT_COLS = 26;
const DEFAULT_ROW_HEIGHT = 24;
const DEFAULT_COL_WIDTH = 100;
const DEFAULT_MAX_HEIGHT = 400;
const BUFFER = 5;

function toCellValue(raw: string): CellValue {
  if (raw === '') return null;
  if (raw.startsWith('=')) return raw;
  const n = Number(raw);
  if (!isNaN(n) && raw.trim() !== '') return n;
  return raw;
}

function parseRef(ref: string): { col: number; row: number } | null {
  const m = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!m) return null;
  let col = 0;
  for (const ch of m[1].toUpperCase()) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col: col - 1, row: parseInt(m[2], 10) - 1 };
}

// ── Row / column shift helpers ────────────────────────────────────────────────

function shiftRows(cells: CellMap, fromRow: number, delta: number): CellMap {
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

function shiftCols(cells: CellMap, fromCol: number, delta: number): CellMap {
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

// ── Context menu ──────────────────────────────────────────────────────────────

interface CtxItem { label: string; action: () => void; disabled?: boolean }
type CtxEntry = CtxItem | null;

function CtxMenu({ x, y, items, onClose }: {
  x: number; y: number; items: CtxEntry[]; onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="ss-ctx-menu"
      style={{ position: 'fixed', left: x, top: y }}
    >
      {items.map((item, i) =>
        item === null ? (
          <div key={i} className="ss-ctx-sep" />
        ) : (
          <button
            key={i}
            className="ss-ctx-item"
            disabled={item.disabled}
            onPointerDown={e => e.stopPropagation()}
            onClick={() => { item.action(); onClose(); }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

// ── Selection ─────────────────────────────────────────────────────────────────

interface Sel {
  anchor: { col: number; row: number };
  active: { col: number; row: number };
}

function selectionBounds(sel: Sel) {
  return {
    minCol: Math.min(sel.anchor.col, sel.active.col),
    maxCol: Math.max(sel.anchor.col, sel.active.col),
    minRow: Math.min(sel.anchor.row, sel.active.row),
    maxRow: Math.max(sel.anchor.row, sel.active.row),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Spreadsheet({
  cells,
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS,
  colWidths,
  rowHeight = DEFAULT_ROW_HEIGHT,
  showFormulaBar = true,
  showRowNumbers = true,
  showColHeaders = true,
  readOnly = false,
  maxHeight = DEFAULT_MAX_HEIGHT,
  onCellChange,
  onCellsChange,
}: SpreadsheetProps) {
  const computed = useMemo(() => evaluate(cells), [cells]);

  const [selection, setSelection] = useState<Sel>({
    anchor: { col: 0, row: 0 },
    active: { col: 0, row: 0 },
  });
  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const selectedAddr = selection.active;
  const selectedRef = useMemo(
    () => addressToRef(selection.active.col, selection.active.row),
    [selection.active.col, selection.active.row]
  );
  const anchorRef = useMemo(
    () => addressToRef(selection.anchor.col, selection.anchor.row),
    [selection.anchor.col, selection.anchor.row]
  );

  const { minCol: selMinCol, maxCol: selMaxCol, minRow: selMinRow, maxRow: selMaxRow } =
    useMemo(() => selectionBounds(selection), [selection]);

  const selectionLabel = useMemo(() => {
    if (selMinCol === selMaxCol && selMinRow === selMaxRow) return selectedRef;
    return `${addressToRef(selMinCol, selMinRow)}:${addressToRef(selMaxCol, selMaxRow)}`;
  }, [selMinCol, selMaxCol, selMinRow, selMaxRow, selectedRef]);

  // Context menu + clipboard
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const closeCtx = useCallback(() => setCtxMenu(null), []);
  const clipboardRef = useRef<{ value: CellValue; cut: boolean; fromRef: string } | null>(null);
  const editSourceRef = useRef<'cell' | 'bar'>('cell');

  // Drag-to-move (selection)
  const cellsRef = useRef(cells);
  cellsRef.current = cells;
  const onCellsChangeRef = useRef(onCellsChange);
  onCellsChangeRef.current = onCellsChange;
  const [dragPreview, setDragPreview] = useState<{
    minCol: number; maxCol: number; minRow: number; maxRow: number;
  } | null>(null);

  // Resizable column widths and row heights (internal state, seeded from props)
  const [internalColWidths, setInternalColWidths] = useState<Record<number, number>>(
    () => ({ ...(colWidths ?? {}) })
  );
  const [internalRowHeights, setInternalRowHeights] = useState<Record<number, number>>({});
  const colWidth = (col: number) => internalColWidths[col] ?? DEFAULT_COL_WIDTH;
  const rowHeightOf = (row: number) => internalRowHeights[row] ?? rowHeight;

  const startColResize = useCallback((col: number, startX: number) => {
    const initW = internalColWidths[col] ?? DEFAULT_COL_WIDTH;
    const onMove = (e: PointerEvent) => {
      document.documentElement.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      setInternalColWidths(prev => ({ ...prev, [col]: Math.max(20, initW + e.clientX - startX) }));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [internalColWidths]);

  const startRowResize = useCallback((row: number, startY: number) => {
    const initH = internalRowHeights[row] ?? rowHeight;
    const onMove = (e: PointerEvent) => {
      document.documentElement.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      setInternalRowHeights(prev => ({ ...prev, [row]: Math.max(12, initH + e.clientY - startY) }));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [internalRowHeights, rowHeight]);

  // Virtual scrolling state
  const [scrollTop, setScrollTop] = useState(0);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);

  // Cumulative row tops for accurate virtual scroll with variable row heights
  const rowTops = useMemo(() => {
    const tops = new Array<number>(rows + 1);
    tops[0] = 0;
    for (let r = 0; r < rows; r++) tops[r + 1] = tops[r] + rowHeightOf(r);
    return tops;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, internalRowHeights, rowHeight]);

  const scrollBodyHeight = maxHeight;

  const visibleStart = useMemo(() => {
    let r = 0;
    while (r < rows - 1 && rowTops[r + 1] <= scrollTop) r++;
    return Math.max(0, r - BUFFER);
  }, [scrollTop, rowTops, rows]);

  const visibleEnd = useMemo(() => {
    let r = visibleStart;
    while (r < rows - 1 && rowTops[r + 1] < scrollTop + scrollBodyHeight) r++;
    return Math.min(rows - 1, r + BUFFER);
  }, [visibleStart, scrollTop, scrollBodyHeight, rowTops, rows]);

  const topSpacerHeight = rowTops[visibleStart];
  const bottomSpacerHeight = Math.max(0, rowTops[rows] - rowTops[Math.min(rows, visibleEnd + 1)]);

  const getRawValue = useCallback(
    (ref: string): string => {
      const v = cells[ref];
      if (v === null || v === undefined) return '';
      return String(v);
    },
    [cells]
  );

  const getDisplayValue = useCallback(
    (ref: string): string => {
      const v = computed[ref];
      if (v === null || v === undefined) return '';
      return String(v);
    },
    [computed]
  );

  const commitEdit = useCallback(
    (ref: string, value: string) => {
      const cellValue = toCellValue(value);
      onCellChange?.(ref, cellValue as string | number | null);
      onCellsChange?.({ ...cells, [ref]: cellValue });
      setEditingRef(null);
      setEditValue('');
    },
    [cells, onCellChange, onCellsChange]
  );

  const cancelEdit = useCallback(() => {
    setEditingRef(null);
    setEditValue('');
  }, []);

  const enterEditMode = useCallback(
    (ref: string, initialValue?: string) => {
      if (readOnly) return;
      editSourceRef.current = 'cell';
      const raw = initialValue !== undefined ? initialValue : getRawValue(ref);
      setEditingRef(ref);
      setEditValue(raw);
    },
    [readOnly, getRawValue]
  );

  const scrollActiveIntoView = useCallback(
    (row: number) => {
      if (!scrollBodyRef.current) return;
      const cellTop = rowTops[row];
      const cellBottom = rowTops[row + 1];
      const st = scrollBodyRef.current.scrollTop;
      const vh = scrollBodyRef.current.clientHeight;
      if (cellTop < st) scrollBodyRef.current.scrollTop = cellTop;
      else if (cellBottom > st + vh) scrollBodyRef.current.scrollTop = cellBottom - vh;
    },
    [rowTops]
  );

  const navigate = useCallback(
    (dCol: number, dRow: number, extend = false) => {
      const newCol = Math.max(0, Math.min(cols - 1, selection.active.col + dCol));
      const newRow = Math.max(0, Math.min(rows - 1, selection.active.row + dRow));
      const newActive = { col: newCol, row: newRow };
      setSelection({
        anchor: extend ? selection.anchor : newActive,
        active: newActive,
      });
      scrollActiveIntoView(newRow);
    },
    [selection, cols, rows, scrollActiveIntoView]
  );

  // Range select via pointer drag
  const startRangeSelect = useCallback(
    (col: number, row: number) => {
      setSelection({ anchor: { col, row }, active: { col, row } });

      const onMove = (e: PointerEvent) => {
        document.body.style.userSelect = 'none';
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cellEl = el?.closest<HTMLElement>('[data-ref]');
        if (!cellEl?.dataset.ref) return;
        const addr = parseRef(cellEl.dataset.ref);
        if (!addr) return;
        setSelection(prev => ({ anchor: prev.anchor, active: addr }));
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        document.body.style.userSelect = '';
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    []
  );

  // Drag-to-move the current selection
  const startSelectionDrag = useCallback(
    (grabCol: number, grabRow: number, startX: number, startY: number) => {
      if (readOnly) return;

      const srcMinCol = selMinCol;
      const srcMaxCol = selMaxCol;
      const srcMinRow = selMinRow;
      const srcMaxRow = selMaxRow;
      const selW = srcMaxCol - srcMinCol;
      const selH = srcMaxRow - srcMinRow;
      const offsetCol = grabCol - srcMinCol;
      const offsetRow = grabRow - srcMinRow;

      let didMove = false;
      let currentPreview: typeof dragPreview = null;

      const onMove = (e: PointerEvent) => {
        if (!didMove && Math.hypot(e.clientX - startX, e.clientY - startY) < 4) return;
        if (!didMove) {
          didMove = true;
          document.documentElement.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
        }
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cellEl = el?.closest<HTMLElement>('[data-ref]');
        if (!cellEl?.dataset.ref) return;
        const addr = parseRef(cellEl.dataset.ref);
        if (!addr) return;
        const newMinCol = Math.max(0, Math.min(cols - 1 - selW, addr.col - offsetCol));
        const newMinRow = Math.max(0, Math.min(rows - 1 - selH, addr.row - offsetRow));
        currentPreview = { minCol: newMinCol, maxCol: newMinCol + selW, minRow: newMinRow, maxRow: newMinRow + selH };
        setDragPreview(currentPreview);
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        document.documentElement.style.cursor = '';
        document.body.style.userSelect = '';
        setDragPreview(null);

        if (!didMove) {
          setSelection({ anchor: { col: grabCol, row: grabRow }, active: { col: grabCol, row: grabRow } });
          return;
        }
        if (!currentPreview) return;

        const dCol = currentPreview.minCol - srcMinCol;
        const dRow = currentPreview.minRow - srcMinRow;
        if (dCol === 0 && dRow === 0) return;

        // Snapshot source values before mutating
        const snapshot: Record<string, CellValue> = {};
        for (let r = srcMinRow; r <= srcMaxRow; r++)
          for (let c = srcMinCol; c <= srcMaxCol; c++)
            snapshot[addressToRef(c, r)] = cellsRef.current[addressToRef(c, r)];

        const next = { ...cellsRef.current };
        for (const ref of Object.keys(snapshot)) delete next[ref];
        for (let r = srcMinRow; r <= srcMaxRow; r++) {
          for (let c = srcMinCol; c <= srcMaxCol; c++) {
            const val = snapshot[addressToRef(c, r)];
            if (val !== undefined && val !== null)
              next[addressToRef(c + dCol, r + dRow)] = val;
          }
        }
        onCellsChangeRef.current?.(next);
        setSelection({
          anchor: { col: currentPreview.minCol, row: currentPreview.minRow },
          active: { col: currentPreview.maxCol, row: currentPreview.maxRow },
        });
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [readOnly, selMinCol, selMaxCol, selMinRow, selMaxRow, cols, rows]
  );

  // Grid-level keydown (when not editing)
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (editingRef) return;

      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); navigate(0, -1, e.shiftKey); break;
        case 'ArrowDown':  e.preventDefault(); navigate(0, 1, e.shiftKey); break;
        case 'ArrowLeft':  e.preventDefault(); navigate(-1, 0, e.shiftKey); break;
        case 'ArrowRight': e.preventDefault(); navigate(1, 0, e.shiftKey); break;
        case 'Tab':
          e.preventDefault();
          navigate(e.shiftKey ? -1 : 1, 0);
          break;
        case 'Enter':
        case 'F2':
          e.preventDefault();
          enterEditMode(anchorRef);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          commitEdit(anchorRef, '');
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            enterEditMode(anchorRef, e.key);
          }
      }
    },
    [editingRef, navigate, enterEditMode, selectedRef, commitEdit]
  );

  // Inline cell input keydown
  const handleCellInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, ref: string) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit(ref, editValue);
        navigate(0, 1);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit(ref, editValue);
        navigate(e.shiftKey ? -1 : 1, 0);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    },
    [editValue, commitEdit, cancelEdit, navigate]
  );

  // Formula bar keydown
  const handleFormulaBarKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit(editingRef ?? anchorRef, editValue);
        gridWrapperRef.current?.focus({ preventScroll: true });
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
        gridWrapperRef.current?.focus({ preventScroll: true });
      }
    },
    [editingRef, editValue, commitEdit, cancelEdit, selectedRef]
  );

  useEffect(() => {
    gridWrapperRef.current?.focus({ preventScroll: true });
  }, []);

  const formulaBarValue = editingRef ? editValue : getRawValue(anchorRef);

  const rowNumWidth = 40;

  return (
    <div className="ss-root">
      {showFormulaBar && (
        <div className="ss-formula-bar">
          <input
            className="ss-formula-ref"
            value={selectionLabel}
            readOnly
            aria-label="Cell reference"
          />
          <span className="ss-formula-sep">=</span>
          <input
            className="ss-formula-input"
            value={formulaBarValue}
            onChange={e => {
              if (readOnly) return;
              if (!editingRef) {
                editSourceRef.current = 'bar';
                setEditingRef(anchorRef);
              }
              setEditValue(e.target.value);
            }}
            onKeyDown={handleFormulaBarKeyDown}
            readOnly={readOnly}
            aria-label="Formula input"
          />
          <button
            className="ss-export-btn"
            title="Export CSV"
            onClick={() => {
              const csv = exportCsv(cells, computed, rows, cols);
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'spreadsheet.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            ↓ CSV
          </button>
        </div>
      )}

      <div className="ss-container">
        <div
          className="ss-scroll-body"
          ref={scrollBodyRef}
          style={{ maxHeight: scrollBodyHeight, overflowY: 'auto', overflowX: 'auto' }}
          onScroll={e => setScrollTop((e.currentTarget as HTMLDivElement).scrollTop)}
        >
          {showColHeaders && (
            <div
              className="ss-col-header-row"
              style={{ minWidth: (showRowNumbers ? rowNumWidth : 0) + cols * DEFAULT_COL_WIDTH }}
            >
              {showRowNumbers && (
                <div
                  className="ss-corner"
                  style={{ width: rowNumWidth, minWidth: rowNumWidth }}
                />
              )}
              {Array.from({ length: cols }, (_, c) => {
                const isColSelected = c >= selMinCol && c <= selMaxCol;
                return (
                  <div
                    key={c}
                    className={`ss-col-header${isColSelected ? ' ss-col-header--selected' : ''}`}
                    style={{ width: colWidth(c), minWidth: colWidth(c) }}
                    onClick={() => {
                      setSelection({
                        anchor: { col: c, row: 0 },
                        active: { col: c, row: rows - 1 },
                      });
                      gridWrapperRef.current?.focus({ preventScroll: true });
                    }}
                  >
                    {colToLetters(c)}
                    <div
                      className="ss-col-resize-handle"
                      onClick={e => e.stopPropagation()}
                      onPointerDown={e => { e.stopPropagation(); e.preventDefault(); startColResize(c, e.clientX); }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div
            className="ss-grid-inner"
            ref={gridWrapperRef}
            tabIndex={0}
            onKeyDown={handleGridKeyDown}
            style={{
              position: 'relative',
              height: rowTops[rows],
              outline: 'none',
              minWidth: (showRowNumbers ? rowNumWidth : 0) + cols * DEFAULT_COL_WIDTH,
            }}
          >
            {topSpacerHeight > 0 && (
              <div className="ss-top-spacer" style={{ height: topSpacerHeight }} />
            )}

            <div className="ss-visible-rows">
              {Array.from({ length: visibleEnd - visibleStart + 1 }, (_, i) => {
                const rowIdx = visibleStart + i;
                const isRowSelected = rowIdx >= selMinRow && rowIdx <= selMaxRow;
                return (
                  <div key={rowIdx} className="ss-row" style={{ height: rowHeightOf(rowIdx) }}>
                    {showRowNumbers && (
                      <div
                        className={`ss-row-num${isRowSelected ? ' ss-row-num--selected' : ''}`}
                        style={{ width: rowNumWidth, minWidth: rowNumWidth }}
                        onClick={() => {
                          setSelection({
                            anchor: { col: 0, row: rowIdx },
                            active: { col: cols - 1, row: rowIdx },
                          });
                          gridWrapperRef.current?.focus({ preventScroll: true });
                        }}
                      >
                        {rowIdx + 1}
                        <div
                          className="ss-row-resize-handle"
                          onClick={e => e.stopPropagation()}
                          onPointerDown={e => { e.stopPropagation(); e.preventDefault(); startRowResize(rowIdx, e.clientY); }}
                        />
                      </div>
                    )}
                    {Array.from({ length: cols }, (_, colIdx) => {
                      const ref = addressToRef(colIdx, rowIdx);
                      const isEditing = ref === editingRef;
                      const isInRange =
                        colIdx >= selMinCol && colIdx <= selMaxCol &&
                        rowIdx >= selMinRow && rowIdx <= selMaxRow;
                      const isAnchor =
                        colIdx === selection.anchor.col && rowIdx === selection.anchor.row;
                      const isInDragPreview = dragPreview !== null &&
                        colIdx >= dragPreview.minCol && colIdx <= dragPreview.maxCol &&
                        rowIdx >= dragPreview.minRow && rowIdx <= dragPreview.maxRow;
                      const rawVal = getRawValue(ref);
                      const displayVal = getDisplayValue(ref);
                      const isFormulaCel = rawVal.startsWith('=');
                      const isErrorCel = isError(computed[ref]);

                      let cellClass = 'ss-cell';
                      if (isInRange) cellClass += ' ss-cell--in-selection';
                      if (isInRange && !isAnchor) cellClass += ' ss-cell--in-range';
                      if (isEditing) cellClass += ' ss-cell--editing';
                      if (isErrorCel) cellClass += ' ss-cell--error';
                      else if (isFormulaCel) cellClass += ' ss-cell--formula';
                      if (isInDragPreview) cellClass += ' ss-cell--drag-preview';

                      return (
                        <div
                          key={colIdx}
                          className={cellClass}
                          data-ref={ref}
                          style={{
                            width: colWidth(colIdx),
                            minWidth: colWidth(colIdx),
                          }}
                          onPointerDown={e => {
                            if (e.button !== 0 || editingRef === ref) return;
                            if (editingRef && editingRef !== ref) commitEdit(editingRef, editValue);
                            if (e.shiftKey) {
                              setSelection(prev => ({ anchor: prev.anchor, active: { col: colIdx, row: rowIdx } }));
                              gridWrapperRef.current?.focus({ preventScroll: true });
                              return;
                            }
                            if (isInRange) {
                              startSelectionDrag(colIdx, rowIdx, e.clientX, e.clientY);
                            } else {
                              startRangeSelect(colIdx, rowIdx);
                            }
                            gridWrapperRef.current?.focus({ preventScroll: true });
                          }}
                          onDoubleClick={() => enterEditMode(ref)}
                          onContextMenu={e => {
                            e.preventDefault();
                            if (editingRef && editingRef !== ref) commitEdit(editingRef, editValue);
                            setSelection({ anchor: { col: colIdx, row: rowIdx }, active: { col: colIdx, row: rowIdx } });
                            setCtxMenu({ x: e.clientX, y: e.clientY });
                          }}
                        >
                          {isEditing ? (
                            <input
                              className="ss-cell-input"
                              value={editValue}
                              autoFocus={editSourceRef.current === 'cell'}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => handleCellInputKeyDown(e, ref)}
                              onBlur={() => commitEdit(ref, editValue)}
                              onClick={e => e.stopPropagation()}
                              style={{ width: '100%', height: '100%' }}
                            />
                          ) : (
                            <span className="ss-cell-content">{displayVal}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {bottomSpacerHeight > 0 && (
              <div className="ss-bottom-spacer" style={{ height: bottomSpacerHeight }} />
            )}

            {/* Selection border overlay */}
            {(() => {
              let left = showRowNumbers ? rowNumWidth : 0;
              for (let c = 0; c < selMinCol; c++) left += colWidth(c);
              let width = 0;
              for (let c = selMinCol; c <= selMaxCol; c++) width += colWidth(c);
              return (
                <div
                  className="ss-selection-overlay"
                  style={{
                    top: rowTops[selMinRow],
                    left,
                    width,
                    height: rowTops[selMaxRow + 1] - rowTops[selMinRow],
                  }}
                />
              );
            })()}
          </div>
        </div>
      </div>

      {ctxMenu && (() => {
        const cb = clipboardRef.current;
        const rawVal = cells[selectedRef] ?? null;

        const items: CtxEntry[] = [
          {
            label: 'Cut',
            action: () => { clipboardRef.current = { value: rawVal, cut: true, fromRef: selectedRef }; },
          },
          {
            label: 'Copy',
            action: () => { clipboardRef.current = { value: rawVal, cut: false, fromRef: selectedRef }; },
          },
          {
            label: 'Paste',
            disabled: !cb,
            action: () => {
              if (!cb) return;
              const next = { ...cells, [selectedRef]: cb.value };
              if (cb.cut) { delete next[cb.fromRef]; clipboardRef.current = null; }
              onCellsChange?.(next);
            },
          },
          {
            label: 'Clear',
            action: () => {
              const next = { ...cells };
              delete next[selectedRef];
              onCellsChange?.(next);
            },
          },
          null,
          { label: 'Insert row above', action: () => onCellsChange?.(shiftRows(cells, selectedAddr.row,     1)) },
          { label: 'Insert row below', action: () => onCellsChange?.(shiftRows(cells, selectedAddr.row + 1, 1)) },
          { label: 'Delete row',       action: () => onCellsChange?.(shiftRows(cells, selectedAddr.row,    -1)) },
          null,
          { label: 'Insert column left',  action: () => onCellsChange?.(shiftCols(cells, selectedAddr.col,     1)) },
          { label: 'Insert column right', action: () => onCellsChange?.(shiftCols(cells, selectedAddr.col + 1, 1)) },
          { label: 'Delete column',       action: () => onCellsChange?.(shiftCols(cells, selectedAddr.col,    -1)) },
        ];

        return <CtxMenu x={ctxMenu.x} y={ctxMenu.y} items={items} onClose={closeCtx} />;
      })()}
    </div>
  );
}
