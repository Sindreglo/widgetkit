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

  const [selectedRef, setSelectedRef] = useState<string>('A1');
  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Virtual scrolling state
  const [scrollTop, setScrollTop] = useState(0);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);

  // Parse selected ref into col/row indices
  const selectedAddr = useMemo(() => {
    const m = selectedRef.match(/^([A-Z]+)(\d+)$/i);
    if (!m) return { col: 0, row: 0 };
    let col = 0;
    for (let i = 0; i < m[1].length; i++) {
      col = col * 26 + (m[1].toUpperCase().charCodeAt(i) - 64);
    }
    return { col: col - 1, row: parseInt(m[2], 10) - 1 };
  }, [selectedRef]);

  // Virtual scroll: which rows to render
  const visibleStart = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER);
  const scrollBodyHeight = maxHeight;
  const visibleCount = Math.ceil(scrollBodyHeight / rowHeight) + BUFFER * 2;
  const visibleEnd = Math.min(rows - 1, visibleStart + visibleCount);

  const topSpacerHeight = visibleStart * rowHeight;
  const bottomSpacerHeight = Math.max(0, (rows - 1 - visibleEnd) * rowHeight);

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
      const raw = initialValue !== undefined ? initialValue : getRawValue(ref);
      setEditingRef(ref);
      setEditValue(raw);
    },
    [readOnly, getRawValue]
  );

  const navigate = useCallback(
    (dCol: number, dRow: number) => {
      const newCol = Math.max(0, Math.min(cols - 1, selectedAddr.col + dCol));
      const newRow = Math.max(0, Math.min(rows - 1, selectedAddr.row + dRow));
      const ref = addressToRef(newCol, newRow);
      setSelectedRef(ref);

      // Scroll selected cell into view
      if (scrollBodyRef.current) {
        const cellTop = newRow * rowHeight;
        const cellBottom = cellTop + rowHeight;
        const currentScrollTop = scrollBodyRef.current.scrollTop;
        const viewHeight = scrollBodyRef.current.clientHeight;
        if (cellTop < currentScrollTop) {
          scrollBodyRef.current.scrollTop = cellTop;
        } else if (cellBottom > currentScrollTop + viewHeight) {
          scrollBodyRef.current.scrollTop = cellBottom - viewHeight;
        }
      }
    },
    [selectedAddr, cols, rows, rowHeight]
  );

  // Grid-level keydown (when not editing)
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (editingRef) return;

      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); navigate(0, -1); break;
        case 'ArrowDown':  e.preventDefault(); navigate(0, 1); break;
        case 'ArrowLeft':  e.preventDefault(); navigate(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); navigate(1, 0); break;
        case 'Tab':
          e.preventDefault();
          navigate(e.shiftKey ? -1 : 1, 0);
          break;
        case 'Enter':
        case 'F2':
          e.preventDefault();
          enterEditMode(selectedRef);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          commitEdit(selectedRef, '');
          break;
        default:
          // Printable character — start editing
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            enterEditMode(selectedRef, e.key);
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
      // Arrow keys bubble normally for cursor movement
    },
    [editValue, commitEdit, cancelEdit, navigate]
  );

  // Formula bar keydown
  const handleFormulaBarKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (editingRef) {
          commitEdit(editingRef, editValue);
        } else {
          commitEdit(selectedRef, editValue);
        }
        gridWrapperRef.current?.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
        gridWrapperRef.current?.focus();
      }
    },
    [editingRef, editValue, commitEdit, cancelEdit, selectedRef]
  );

  // Focus grid wrapper on mount
  useEffect(() => {
    gridWrapperRef.current?.focus();
  }, []);

  // Formula bar value: show raw formula/value of selected cell
  // When editing, show current edit value
  const formulaBarValue =
    editingRef === selectedRef ? editValue : getRawValue(selectedRef);

  const colWidth = (col: number) =>
    colWidths?.[col] ?? DEFAULT_COL_WIDTH;

  // Row number column width
  const rowNumWidth = 40;

  return (
    <div className="ss-root">
      {showFormulaBar && (
        <div className="ss-formula-bar">
          <input
            className="ss-formula-ref"
            value={selectedRef}
            readOnly
            aria-label="Cell reference"
          />
          <span className="ss-formula-sep">=</span>
          <input
            className="ss-formula-input"
            value={formulaBarValue}
            onChange={e => {
              if (readOnly) return;
              if (!editingRef) setEditingRef(selectedRef);
              setEditValue(e.target.value);
            }}
            onKeyDown={handleFormulaBarKeyDown}
            readOnly={readOnly}
            aria-label="Formula input"
          />
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
              {Array.from({ length: cols }, (_, c) => (
                <div
                  key={c}
                  className="ss-col-header"
                  style={{ width: colWidth(c), minWidth: colWidth(c) }}
                >
                  {colToLetters(c)}
                </div>
              ))}
            </div>
          )}

          <div
            className="ss-grid-inner"
            ref={gridWrapperRef}
            tabIndex={0}
            onKeyDown={handleGridKeyDown}
            style={{
              position: 'relative',
              height: rows * rowHeight,
              outline: 'none',
              minWidth: (showRowNumbers ? rowNumWidth : 0) + cols * DEFAULT_COL_WIDTH,
            }}
          >
            {/* Top spacer */}
            {topSpacerHeight > 0 && (
              <div className="ss-top-spacer" style={{ height: topSpacerHeight }} />
            )}

            <div className="ss-visible-rows">
              {Array.from({ length: visibleEnd - visibleStart + 1 }, (_, i) => {
                const rowIdx = visibleStart + i;
                return (
                  <div key={rowIdx} className="ss-row" style={{ height: rowHeight }}>
                    {showRowNumbers && (
                      <div
                        className="ss-row-num"
                        style={{ width: rowNumWidth, minWidth: rowNumWidth }}
                      >
                        {rowIdx + 1}
                      </div>
                    )}
                    {Array.from({ length: cols }, (_, colIdx) => {
                      const ref = addressToRef(colIdx, rowIdx);
                      const isSelected = ref === selectedRef;
                      const isEditing = ref === editingRef;
                      const rawVal = getRawValue(ref);
                      const displayVal = getDisplayValue(ref);
                      const isFormulaCel = rawVal.startsWith('=');
                      const isErrorCel = isError(computed[ref]);

                      let cellClass = 'ss-cell';
                      if (isSelected) cellClass += ' ss-cell--selected';
                      if (isEditing) cellClass += ' ss-cell--editing';
                      if (isErrorCel) cellClass += ' ss-cell--error';
                      else if (isFormulaCel) cellClass += ' ss-cell--formula';

                      return (
                        <div
                          key={colIdx}
                          className={cellClass}
                          data-ref={ref}
                          style={{
                            width: colWidth(colIdx),
                            minWidth: colWidth(colIdx),
                          }}
                          onClick={() => {
                            if (editingRef && editingRef !== ref) {
                              commitEdit(editingRef, editValue);
                            }
                            setSelectedRef(ref);
                            gridWrapperRef.current?.focus();
                          }}
                          onDoubleClick={() => enterEditMode(ref)}
                        >
                          {isEditing ? (
                            <input
                              className="ss-cell-input"
                              value={editValue}
                              autoFocus
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => handleCellInputKeyDown(e, ref)}
                              onBlur={() => commitEdit(ref, editValue)}
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

            {/* Bottom spacer */}
            {bottomSpacerHeight > 0 && (
              <div className="ss-bottom-spacer" style={{ height: bottomSpacerHeight }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
