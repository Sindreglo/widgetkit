import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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
import type { SpreadsheetProps, SpreadsheetHandle, CellFormat, NumberFormat } from './types';

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

interface RangeClipboard {
  data: CellValue[][];
  cut: boolean;
  srcMinCol: number; srcMinRow: number;
  srcMaxCol: number; srcMaxRow: number;
}

function selectionBounds(sel: Sel) {
  return {
    minCol: Math.min(sel.anchor.col, sel.active.col),
    maxCol: Math.max(sel.anchor.col, sel.active.col),
    minRow: Math.min(sel.anchor.row, sel.active.row),
    maxRow: Math.max(sel.anchor.row, sel.active.row),
  };
}

// ── Number formatting ─────────────────────────────────────────────────────────

function formatCellValue(val: CellValue, fmt: CellFormat): string {
  if (val === null || val === undefined) return '';
  const nf: NumberFormat = fmt.numberFormat ?? 'general';
  if (nf === 'general') return String(val);
  const decimals = fmt.decimalPlaces ?? (nf === 'percent' ? 0 : 2);
  switch (nf) {
    case 'number': {
      const n = Number(val);
      return isNaN(n) ? String(val) : n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    case 'currency': {
      const n = Number(val);
      return isNaN(n) ? String(val) : n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    case 'percent': {
      const n = Number(val);
      return isNaN(n) ? String(val) : (n * 100).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + '%';
    }
    case 'date': {
      const n = Number(val);
      if (!isNaN(n) && String(val).trim() !== '') return new Date(n).toLocaleDateString();
      const d = new Date(String(val));
      return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString();
    }
    default: return String(val);
  }
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function Toolbar({ anchorRef, formats, onFormat }: {
  anchorRef: string;
  formats: Record<string, CellFormat> | undefined;
  onFormat: (patch: Partial<CellFormat>) => void;
}) {
  const fmt = formats?.[anchorRef] ?? {};
  return (
    <div className="ss-toolbar" onMouseDown={e => e.preventDefault()}>
      <button
        className={`ss-tb-btn${fmt.bold ? ' ss-tb-btn--active' : ''}`}
        onClick={() => onFormat({ bold: !fmt.bold })}
        title="Bold (Ctrl+B)"
      ><strong>B</strong></button>
      <button
        className={`ss-tb-btn${fmt.italic ? ' ss-tb-btn--active' : ''}`}
        onClick={() => onFormat({ italic: !fmt.italic })}
        title="Italic (Ctrl+I)"
      ><em>I</em></button>
      <div className="ss-tb-sep" />
      <label className="ss-tb-color-btn" title="Text color">
        <span className="ss-tb-color-label">A</span>
        <span className="ss-tb-color-swatch" style={{ background: fmt.color ?? '#1e293b' }} />
        <input type="color" className="ss-tb-color-input"
          value={fmt.color ?? '#1e293b'}
          onMouseDown={e => e.stopPropagation()}
          onChange={e => onFormat({ color: e.target.value })} />
      </label>
      <label className="ss-tb-color-btn" title="Fill color">
        <span className="ss-tb-fill-icon" />
        <span className="ss-tb-color-swatch" style={{ background: fmt.background ?? '#ffffff' }} />
        <input type="color" className="ss-tb-color-input"
          value={fmt.background ?? '#ffffff'}
          onMouseDown={e => e.stopPropagation()}
          onChange={e => onFormat({ background: e.target.value })} />
      </label>
      <div className="ss-tb-sep" />
      <select
        className="ss-tb-select"
        value={fmt.numberFormat ?? 'general'}
        onChange={e => onFormat({ numberFormat: e.target.value as NumberFormat })}
        onMouseDown={e => e.stopPropagation()}
        title="Number format"
      >
        <option value="general">General</option>
        <option value="number">Number</option>
        <option value="currency">Currency</option>
        <option value="percent">Percent</option>
        <option value="date">Date</option>
      </select>
      {['number', 'currency', 'percent'].includes(fmt.numberFormat ?? 'general') && (<>
        <button className="ss-tb-btn ss-tb-btn--wide" title="Decrease decimals"
          onClick={() => onFormat({ decimalPlaces: Math.max(0, (fmt.decimalPlaces ?? (fmt.numberFormat === 'percent' ? 0 : 2)) - 1) })}
        >.0−</button>
        <button className="ss-tb-btn ss-tb-btn--wide" title="Increase decimals"
          onClick={() => onFormat({ decimalPlaces: (fmt.decimalPlaces ?? (fmt.numberFormat === 'percent' ? 0 : 2)) + 1 })}
        >.0+</button>
      </>)}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Spreadsheet = forwardRef<SpreadsheetHandle, SpreadsheetProps>(function Spreadsheet({
  cells,
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS,
  colWidths,
  rowHeight = DEFAULT_ROW_HEIGHT,
  defaultColWidth,
  width,
  height,
  className,
  style,
  showFormulaBar = true,
  showToolbar = false,
  showRowNumbers = true,
  showColHeaders = true,
  showContextMenu = true,
  readOnly = false,
  resizableCols = true,
  resizableRows = true,
  selectionMode = 'range',
  autoExpandRows = true,
  autoExpandCols = false,
  expandRowsBy = 10,
  expandColsBy = 10,
  maxHeight = DEFAULT_MAX_HEIGHT,
  formats,
  merges,
  renderCell,
  onBeforeEdit,
  onValidate,
  onCellClick,
  onCellDoubleClick,
  onKeyDown: onKeyDownProp,
  onSelectionChange,
  onCellChange,
  onCellsChange,
  onFormatsChange,
  onMergesChange,
  contextMenuItems,
  'aria-label': ariaLabel,
}: SpreadsheetProps, ref) {
  const computed = useMemo(() => evaluate(cells), [cells]);

  // Map every cell ref in a merged region → its merge anchor info
  const mergeMap = useMemo(() => {
    const map = new Map<string, { anchorCol: number; anchorRow: number; colSpan: number; rowSpan: number }>();
    if (!merges) return map;
    for (const [ref, { colSpan, rowSpan }] of Object.entries(merges)) {
      const addr = parseRef(ref);
      if (!addr) continue;
      for (let r = addr.row; r < addr.row + rowSpan; r++)
        for (let c = addr.col; c < addr.col + colSpan; c++)
          map.set(addressToRef(c, r), { anchorCol: addr.col, anchorRow: addr.row, colSpan, rowSpan });
    }
    return map;
  }, [merges]);

  const [extraRows, setExtraRows] = useState(0);
  const [extraCols, setExtraCols] = useState(0);
  const effectiveRows = rows + extraRows;
  const effectiveCols = cols + extraCols;

  const [selection, setSelection] = useState<Sel>({
    anchor: { col: 0, row: 0 },
    active: { col: 0, row: 0 },
  });
  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

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

  // Context menu
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const closeCtx = useCallback(() => setCtxMenu(null), []);
  const editSourceRef = useRef<'cell' | 'bar'>('cell');

  // Undo / redo
  const historyRef = useRef<CellMap[]>([]);
  const futureRef = useRef<CellMap[]>([]);
  const pushHistory = useCallback(() => {
    historyRef.current = [...historyRef.current.slice(-49), { ...cellsRef.current }];
    futureRef.current = [];
  }, []);
  const undo = useCallback(() => {
    if (!historyRef.current.length) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [{ ...cellsRef.current }, ...futureRef.current.slice(0, 49)];
    onCellsChangeRef.current?.(prev);
  }, []);
  const redo = useCallback(() => {
    if (!futureRef.current.length) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    historyRef.current = [...historyRef.current.slice(-49), { ...cellsRef.current }];
    onCellsChangeRef.current?.(next);
  }, []);

  // Range clipboard (copy / cut / paste)
  const rangeClipboardRef = useRef<RangeClipboard | null>(null);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const boundsRef = useRef({ selMinCol, selMaxCol, selMinRow, selMaxRow });
  boundsRef.current = { selMinCol, selMaxCol, selMinRow, selMaxRow };

  const copySelection = useCallback((cut: boolean) => {
    const { selMinCol, selMaxCol, selMinRow, selMaxRow } = boundsRef.current;
    const data: CellValue[][] = [];
    for (let r = selMinRow; r <= selMaxRow; r++) {
      const row: CellValue[] = [];
      for (let c = selMinCol; c <= selMaxCol; c++)
        row.push(cellsRef.current[addressToRef(c, r)] ?? null);
      data.push(row);
    }
    rangeClipboardRef.current = { data, cut, srcMinCol: selMinCol, srcMinRow: selMinRow, srcMaxCol: selMaxCol, srcMaxRow: selMaxRow };
    const tsv = data.map(r => r.map(v => v === null ? '' : String(v)).join('\t')).join('\n');
    navigator.clipboard.writeText(tsv).catch(() => {});
  }, []);

  const pasteSelection = useCallback(() => {
    const cb = rangeClipboardRef.current;
    if (!cb) return;
    pushHistory();
    const next = { ...cellsRef.current };
    if (cb.cut) {
      for (let r = cb.srcMinRow; r <= cb.srcMaxRow; r++)
        for (let c = cb.srcMinCol; c <= cb.srcMaxCol; c++)
          delete next[addressToRef(c, r)];
      rangeClipboardRef.current = null;
    }
    const { col: anchorCol, row: anchorRow } = selectionRef.current.anchor;
    for (let r = 0; r < cb.data.length; r++)
      for (let c = 0; c < cb.data[r].length; c++) {
        const val = cb.data[r][c];
        if (val !== null && val !== undefined)
          next[addressToRef(anchorCol + c, anchorRow + r)] = val;
      }
    onCellsChangeRef.current?.(next);
  }, [pushHistory]);

  // Cell formatting
  const applyFormat = useCallback((patch: Partial<CellFormat>) => {
    if (!onFormatsChange) return;
    const { selMinCol, selMaxCol, selMinRow, selMaxRow } = boundsRef.current;
    const next = { ...(formats ?? {}) };
    for (let r = selMinRow; r <= selMaxRow; r++)
      for (let c = selMinCol; c <= selMaxCol; c++) {
        const ref = addressToRef(c, r);
        next[ref] = { ...(next[ref] ?? {}), ...patch };
      }
    onFormatsChange(next);
  }, [formats, onFormatsChange]);

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
  const colWidth = (col: number) => internalColWidths[col] ?? defaultColWidth ?? DEFAULT_COL_WIDTH;

  const rowNumWidth = 40;

  const totalGridWidth = useMemo(() => {
    let w = showRowNumbers ? rowNumWidth : 0;
    for (let c = 0; c < effectiveCols; c++) w += internalColWidths[c] ?? defaultColWidth ?? DEFAULT_COL_WIDTH;
    return w;
  }, [showRowNumbers, effectiveCols, internalColWidths, defaultColWidth]);
  const rowHeightOf = (row: number) => internalRowHeights[row] ?? rowHeight;

  const startColResize = useCallback((col: number, startX: number) => {
    const initW = internalColWidths[col] ?? defaultColWidth ?? DEFAULT_COL_WIDTH;
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
    const tops = new Array<number>(effectiveRows + 1);
    tops[0] = 0;
    for (let r = 0; r < effectiveRows; r++) tops[r + 1] = tops[r] + rowHeightOf(r);
    return tops;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRows, internalRowHeights, rowHeight]);

  const scrollBodyHeight = typeof height === 'number' ? height : maxHeight;

  const visibleStart = useMemo(() => {
    let r = 0;
    while (r < effectiveRows - 1 && rowTops[r + 1] <= scrollTop) r++;
    return Math.max(0, r - BUFFER);
  }, [scrollTop, rowTops, effectiveRows]);

  const visibleEnd = useMemo(() => {
    let r = visibleStart;
    while (r < effectiveRows - 1 && rowTops[r + 1] < scrollTop + scrollBodyHeight) r++;
    return Math.min(effectiveRows - 1, r + BUFFER);
  }, [visibleStart, scrollTop, scrollBodyHeight, rowTops, effectiveRows]);

  const topSpacerHeight = rowTops[visibleStart];
  const bottomSpacerHeight = Math.max(0, rowTops[effectiveRows] - rowTops[Math.min(effectiveRows, visibleEnd + 1)]);

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
      if (isError(v)) return String(v);
      const fmt = formats?.[ref];
      if (!fmt?.numberFormat || fmt.numberFormat === 'general') return String(v);
      return formatCellValue(v, fmt);
    },
    [computed, formats]
  );

  const commitEdit = useCallback(
    (ref: string, value: string) => {
      const cellValue = toCellValue(value);
      if (onValidate) {
        const err = onValidate(ref, cellValue);
        if (err) { setValidationError(err); return; }
      }
      setValidationError(null);
      pushHistory();
      onCellChange?.(ref, cellValue as string | number | null);
      onCellsChange?.({ ...cells, [ref]: cellValue });
      setEditingRef(null);
      setEditValue('');
    },
    [cells, onCellChange, onCellsChange, onValidate, pushHistory]
  );

  const cancelEdit = useCallback(() => {
    setEditingRef(null);
    setEditValue('');
    setValidationError(null);
  }, []);

  const enterEditMode = useCallback(
    (ref: string, initialValue?: string) => {
      if (readOnly) return;
      if (onBeforeEdit && !onBeforeEdit(ref, cells[ref] ?? null)) return;
      editSourceRef.current = 'cell';
      const raw = initialValue !== undefined ? initialValue : getRawValue(ref);
      setEditingRef(ref);
      setEditValue(raw);
    },
    [readOnly, cells, onBeforeEdit, getRawValue]
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
      const newCol = Math.max(0, Math.min(effectiveCols - 1, selection.active.col + dCol));
      const newRow = Math.max(0, Math.min(effectiveRows - 1, selection.active.row + dRow));
      const newActive = { col: newCol, row: newRow };
      const shouldExtend = extend && selectionMode !== 'single';
      setSelection({
        anchor: shouldExtend ? selection.anchor : newActive,
        active: newActive,
      });
      scrollActiveIntoView(newRow);
    },
    [selection, effectiveCols, effectiveRows, selectionMode, scrollActiveIntoView]
  );

  // Range select via pointer drag
  const startRangeSelect = useCallback(
    (col: number, row: number) => {
      setSelection({ anchor: { col, row }, active: { col, row } });

      const onMove = (e: PointerEvent) => {
        if (selectionMode === 'single') return;
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
    [selectionMode]
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
        const newMinCol = Math.max(0, Math.min(effectiveCols - 1 - selW, addr.col - offsetCol));
        const newMinRow = Math.max(0, Math.min(effectiveRows - 1 - selH, addr.row - offsetRow));
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
    [readOnly, selMinCol, selMaxCol, selMinRow, selMaxRow, effectiveCols, effectiveRows]
  );

  // Grid-level keydown (when not editing)
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      onKeyDownProp?.(e);
      if (editingRef) return;

      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); navigate(0, -1, e.shiftKey); break;
        case 'ArrowDown':  e.preventDefault(); navigate(0, 1, e.shiftKey); break;
        case 'ArrowLeft':  e.preventDefault(); navigate(-1, 0, e.shiftKey); break;
        case 'ArrowRight': e.preventDefault(); navigate(1, 0, e.shiftKey); break;
        case 'Home':
          e.preventDefault();
          if (e.ctrlKey) navigate(-selection.active.col, -selection.active.row, e.shiftKey);
          else navigate(-selection.active.col, 0, e.shiftKey);
          break;
        case 'End':
          e.preventDefault();
          if (e.ctrlKey) navigate(effectiveCols - 1 - selection.active.col, effectiveRows - 1 - selection.active.row, e.shiftKey);
          else navigate(effectiveCols - 1 - selection.active.col, 0, e.shiftKey);
          break;
        case 'PageUp':
          e.preventDefault();
          navigate(0, -Math.max(1, Math.floor(scrollBodyHeight / rowHeight)), e.shiftKey);
          break;
        case 'PageDown':
          e.preventDefault();
          navigate(0, Math.max(1, Math.floor(scrollBodyHeight / rowHeight)), e.shiftKey);
          break;
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
        case 'c':
        case 'C':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); copySelection(false); }
          break;
        case 'x':
        case 'X':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); copySelection(true); }
          break;
        case 'v':
        case 'V':
          if ((e.ctrlKey || e.metaKey) && !readOnly) { e.preventDefault(); pasteSelection(); }
          break;
        case 'z':
        case 'Z':
          if ((e.ctrlKey || e.metaKey) && !readOnly) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
          break;
        case 'y':
        case 'Y':
          if ((e.ctrlKey || e.metaKey) && !readOnly) { e.preventDefault(); redo(); }
          break;
        case 'b':
        case 'B':
          if ((e.ctrlKey || e.metaKey) && !readOnly) { e.preventDefault(); applyFormat({ bold: !(formats?.[anchorRef]?.bold) }); }
          break;
        case 'i':
        case 'I':
          if ((e.ctrlKey || e.metaKey) && !readOnly) { e.preventDefault(); applyFormat({ italic: !(formats?.[anchorRef]?.italic) }); }
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            enterEditMode(anchorRef, e.key);
          }
      }
    },
    [editingRef, navigate, enterEditMode, selectedRef, commitEdit, copySelection, pasteSelection, undo, redo, readOnly, applyFormat, formats, anchorRef, onKeyDownProp, selection, effectiveCols, effectiveRows, scrollBodyHeight, rowHeight]
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

  useEffect(() => {
    onSelectionChange?.(selectionLabel);
  }, [selectionLabel, onSelectionChange]);

  useImperativeHandle(ref, () => ({
    scrollToCell: (cellRef: string) => {
      const addr = parseRef(cellRef);
      if (!addr) return;
      setSelection({ anchor: addr, active: addr });
      scrollActiveIntoView(addr.row);
    },
    setSelection: (cellRef: string) => {
      const addr = parseRef(cellRef);
      if (!addr) return;
      setSelection({ anchor: addr, active: addr });
      scrollActiveIntoView(addr.row);
    },
    startEdit: (cellRef: string) => {
      const addr = parseRef(cellRef);
      if (!addr) return;
      setSelection({ anchor: addr, active: addr });
      scrollActiveIntoView(addr.row);
      enterEditMode(cellRef);
    },
    exportCsv: () => exportCsv(cells, computed, effectiveRows, effectiveCols),
    getCells: () => ({ ...cells }),
  }), [scrollActiveIntoView, enterEditMode, cells, computed, effectiveRows, effectiveCols]);

  const formulaBarValue = editingRef ? editValue : getRawValue(anchorRef);

  return (
    <div
      className={`ss-root${className ? ` ${className}` : ''}`}
      style={{
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...style,
      }}
      aria-label={ariaLabel}
    >
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

      {validationError && (
        <div className="ss-validation-error" role="alert">{validationError}</div>
      )}

      {showToolbar && !readOnly && (
        <Toolbar
          anchorRef={anchorRef}
          formats={formats}
          onFormat={applyFormat}
        />
      )}

      <div className="ss-container">
        <div
          className="ss-scroll-body"
          ref={scrollBodyRef}
          style={{
            ...(typeof height === 'number' ? { height: scrollBodyHeight } : { maxHeight: scrollBodyHeight }),
            overflowY: 'auto',
            overflowX: 'auto',
          }}
          onScroll={e => {
            const el = e.currentTarget as HTMLDivElement;
            setScrollTop(el.scrollTop);
            if (autoExpandRows && el.scrollTop + el.clientHeight >= rowTops[effectiveRows] - rowHeight * 2) {
              setExtraRows(prev => prev + expandRowsBy);
            }
            if (autoExpandCols && el.scrollLeft + el.clientWidth >= totalGridWidth - (defaultColWidth ?? DEFAULT_COL_WIDTH) * 2) {
              setExtraCols(prev => prev + expandColsBy);
            }
          }}
        >
          {showColHeaders && (
            <div
              className="ss-col-header-row"
              style={{ minWidth: totalGridWidth }}
            >
              {showRowNumbers && (
                <div
                  className="ss-corner"
                  style={{ width: rowNumWidth, minWidth: rowNumWidth }}
                />
              )}
              {Array.from({ length: effectiveCols }, (_, c) => {
                const isColSelected = c >= selMinCol && c <= selMaxCol;
                return (
                  <div
                    key={c}
                    className={`ss-col-header${isColSelected ? ' ss-col-header--selected' : ''}`}
                    style={{ width: colWidth(c), minWidth: colWidth(c) }}
                    onClick={() => {
                      setSelection({
                        anchor: { col: c, row: 0 },
                        active: { col: c, row: effectiveRows - 1 },
                      });
                      gridWrapperRef.current?.focus({ preventScroll: true });
                    }}
                  >
                    {colToLetters(c)}
                    {resizableCols && (
                      <div
                        className="ss-col-resize-handle"
                        onClick={e => e.stopPropagation()}
                        onPointerDown={e => { e.stopPropagation(); e.preventDefault(); startColResize(c, e.clientX); }}
                      />
                    )}
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
              height: rowTops[effectiveRows],
              outline: 'none',
              minWidth: totalGridWidth,
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
                            active: { col: effectiveCols - 1, row: rowIdx },
                          });
                          gridWrapperRef.current?.focus({ preventScroll: true });
                        }}
                      >
                        {rowIdx + 1}
                        {resizableRows && (
                          <div
                            className="ss-row-resize-handle"
                            onClick={e => e.stopPropagation()}
                            onPointerDown={e => { e.stopPropagation(); e.preventDefault(); startRowResize(rowIdx, e.clientY); }}
                          />
                        )}
                      </div>
                    )}
                    {Array.from({ length: effectiveCols }, (_, colIdx) => {
                      const ref = addressToRef(colIdx, rowIdx);
                      // Hidden placeholder for any cell inside a merged region
                      if (mergeMap.has(ref)) {
                        return (
                          <div key={colIdx} data-ref={ref} style={{ width: colWidth(colIdx), minWidth: colWidth(colIdx), flexShrink: 0, visibility: 'hidden', pointerEvents: 'none' }} />
                        );
                      }
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

                      const fmt = formats?.[ref];
                      let cellClass = 'ss-cell';
                      if (isInRange) cellClass += ' ss-cell--in-selection';
                      if (isInRange && !isAnchor) cellClass += ' ss-cell--in-range';
                      if (isEditing) cellClass += ' ss-cell--editing';
                      if (isErrorCel) cellClass += ' ss-cell--error';
                      else if (isFormulaCel) cellClass += ' ss-cell--formula';
                      if (isInDragPreview) cellClass += ' ss-cell--drag-preview';

                      let cellBg: string | undefined;
                      if (isInDragPreview) {
                        cellBg = `color-mix(in srgb, var(--ss-accent) 22%, ${fmt?.background ?? 'var(--ss-bg)'})`;
                      } else if (isInRange && !isAnchor) {
                        cellBg = `color-mix(in srgb, var(--ss-accent) 12%, ${fmt?.background ?? 'var(--ss-bg)'})`;
                      } else if (fmt?.background) {
                        cellBg = fmt.background;
                      }

                      return (
                        <div
                          key={colIdx}
                          className={cellClass}
                          data-ref={ref}
                          style={{
                            width: colWidth(colIdx),
                            minWidth: colWidth(colIdx),
                            ...(fmt?.bold && { fontWeight: 'bold' }),
                            ...(fmt?.italic && { fontStyle: 'italic' }),
                            ...(fmt?.color && !isErrorCel && { color: fmt.color }),
                            ...(cellBg && { background: cellBg }),
                            ...(fmt?.numberFormat && fmt.numberFormat !== 'general' && fmt.numberFormat !== 'date' && typeof computed[ref] === 'number' && { textAlign: 'right' as const }),
                          }}
                          onPointerDown={e => {
                            if (e.button !== 0 || editingRef === ref) return;
                            if (editingRef && editingRef !== ref) commitEdit(editingRef, editValue);
                            if (e.shiftKey && selectionMode !== 'single') {
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
                          onClick={e => onCellClick?.(ref, computed[ref] ?? null, e)}
                          onDoubleClick={e => { enterEditMode(ref); onCellDoubleClick?.(ref, computed[ref] ?? null, e); }}
                          onContextMenu={e => {
                            e.preventDefault();
                            if (!showContextMenu) return;
                            if (editingRef && editingRef !== ref) commitEdit(editingRef, editValue);
                            if (!isInRange) {
                              setSelection({ anchor: { col: colIdx, row: rowIdx }, active: { col: colIdx, row: rowIdx } });
                            }
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
                            <span className="ss-cell-content">
                              {renderCell ? renderCell(ref, computed[ref] ?? null, formats?.[ref]) : displayVal}
                            </span>
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

            {/* Merged cell overlays */}
            {merges && Object.entries(merges).map(([mRef, { colSpan, rowSpan }]) => {
              const addr = parseRef(mRef);
              if (!addr) return null;
              const { col: aC, row: aR } = addr;
              const effCols = Math.min(colSpan, cols - aC);
              const effRows = Math.min(rowSpan, rows - aR);
              if (effCols <= 0 || effRows <= 0) return null;

              let mLeft = showRowNumbers ? rowNumWidth : 0;
              for (let c = 0; c < aC; c++) mLeft += colWidth(c);
              let mWidth = 0;
              for (let c = aC; c < aC + effCols; c++) mWidth += colWidth(c);
              const mTop = rowTops[aR];
              const mHeight = rowTops[aR + effRows] - mTop;

              const isEditing = mRef === editingRef;
              const isInRange = aC >= selMinCol && aC <= selMaxCol && aR >= selMinRow && aR <= selMaxRow;
              const isAnchor = selection.anchor.col === aC && selection.anchor.row === aR;
              const rawVal = getRawValue(mRef);
              const displayVal = getDisplayValue(mRef);
              const fmt = formats?.[mRef];
              const isFormulaCel = rawVal.startsWith('=');
              const isErrorCel = isError(computed[mRef]);

              let mClass = 'ss-cell ss-merged-cell';
              if (isInRange) mClass += ' ss-cell--in-selection';
              if (isInRange && !isAnchor) mClass += ' ss-cell--in-range';
              if (isEditing) mClass += ' ss-cell--editing';
              if (isErrorCel) mClass += ' ss-cell--error';
              else if (isFormulaCel) mClass += ' ss-cell--formula';

              let mBg: string | undefined;
              if (isInRange && !isAnchor) mBg = `color-mix(in srgb, var(--ss-accent) 12%, ${fmt?.background ?? 'var(--ss-bg)'})`;
              else if (fmt?.background) mBg = fmt.background;

              return (
                <div
                  key={mRef}
                  className={mClass}
                  data-ref={mRef}
                  style={{
                    position: 'absolute', top: mTop, left: mLeft, width: mWidth, height: mHeight, zIndex: 1,
                    ...(fmt?.bold && { fontWeight: 'bold' }),
                    ...(fmt?.italic && { fontStyle: 'italic' }),
                    ...(fmt?.color && !isErrorCel && { color: fmt.color }),
                    ...(mBg && { background: mBg }),
                    ...(fmt?.numberFormat && fmt.numberFormat !== 'general' && fmt.numberFormat !== 'date' && typeof computed[mRef] === 'number' && { textAlign: 'right' as const }),
                  }}
                  onPointerDown={e => {
                    if (e.button !== 0 || editingRef === mRef) return;
                    if (editingRef && editingRef !== mRef) commitEdit(editingRef, editValue);
                    if (e.shiftKey) {
                      setSelection(prev => ({ anchor: prev.anchor, active: { col: aC, row: aR } }));
                      gridWrapperRef.current?.focus({ preventScroll: true });
                      return;
                    }
                    setSelection({ anchor: { col: aC, row: aR }, active: { col: aC + effCols - 1, row: aR + effRows - 1 } });
                    gridWrapperRef.current?.focus({ preventScroll: true });
                  }}
                  onClick={e => onCellClick?.(mRef, computed[mRef] ?? null, e)}
                  onDoubleClick={e => { enterEditMode(mRef); onCellDoubleClick?.(mRef, computed[mRef] ?? null, e); }}
                  onContextMenu={e => {
                    e.preventDefault();
                    if (!showContextMenu) return;
                    if (editingRef && editingRef !== mRef) commitEdit(editingRef, editValue);
                    if (!isInRange) {
                      setSelection({ anchor: { col: aC, row: aR }, active: { col: aC + effCols - 1, row: aR + effRows - 1 } });
                    }
                    setCtxMenu({ x: e.clientX, y: e.clientY });
                  }}
                >
                  {isEditing ? (
                    <input className="ss-cell-input" value={editValue}
                      autoFocus={editSourceRef.current === 'cell'}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => handleCellInputKeyDown(e, mRef)}
                      onBlur={() => commitEdit(mRef, editValue)}
                      onClick={e => e.stopPropagation()}
                      style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <span className="ss-cell-content">
                      {renderCell ? renderCell(mRef, computed[mRef] ?? null, formats?.[mRef]) : displayVal}
                    </span>
                  )}
                </div>
              );
            })}

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

      {ctxMenu && showContextMenu && (() => {
        const hasCb = !!rangeClipboardRef.current;

        const items: CtxEntry[] = [
          { label: 'Cut',   action: () => copySelection(true) },
          { label: 'Copy',  action: () => copySelection(false) },
          {
            label: 'Paste',
            disabled: !hasCb,
            action: () => pasteSelection(),
          },
          {
            label: 'Clear',
            action: () => {
              pushHistory();
              const next = { ...cells };
              for (let r = selMinRow; r <= selMaxRow; r++)
                for (let c = selMinCol; c <= selMaxCol; c++)
                  delete next[addressToRef(c, r)];
              onCellsChange?.(next);
            },
          },
          null,
          { label: 'Insert row above', action: () => { pushHistory(); onCellsChange?.(shiftRows(cells, selectedAddr.row,     1)); } },
          { label: 'Insert row below', action: () => { pushHistory(); onCellsChange?.(shiftRows(cells, selectedAddr.row + 1, 1)); } },
          { label: 'Delete row',       action: () => { pushHistory(); onCellsChange?.(shiftRows(cells, selectedAddr.row,    -1)); } },
          null,
          { label: 'Insert column left',  action: () => { pushHistory(); onCellsChange?.(shiftCols(cells, selectedAddr.col,     1)); } },
          { label: 'Insert column right', action: () => { pushHistory(); onCellsChange?.(shiftCols(cells, selectedAddr.col + 1, 1)); } },
          { label: 'Delete column',       action: () => { pushHistory(); onCellsChange?.(shiftCols(cells, selectedAddr.col,    -1)); } },
          null,
          {
            label: 'Merge cells',
            disabled: !onMergesChange || (selMinCol === selMaxCol && selMinRow === selMaxRow),
            action: () => {
              const ref = addressToRef(selMinCol, selMinRow);
              onMergesChange?.({ ...(merges ?? {}), [ref]: { colSpan: selMaxCol - selMinCol + 1, rowSpan: selMaxRow - selMinRow + 1 } });
              // Clear values of non-anchor cells in merged region
              const next = { ...cells };
              for (let r = selMinRow; r <= selMaxRow; r++)
                for (let c = selMinCol; c <= selMaxCol; c++)
                  if (!(c === selMinCol && r === selMinRow)) delete next[addressToRef(c, r)];
              onCellsChange?.(next);
            },
          },
          {
            label: 'Unmerge cells',
            disabled: !onMergesChange || !merges?.[anchorRef],
            action: () => {
              const next = { ...(merges ?? {}) };
              delete next[anchorRef];
              onMergesChange?.(next);
            },
          },
        ];

        if (contextMenuItems?.length) {
          items.push(null);
          for (const item of contextMenuItems) {
            if (item === null) {
              items.push(null);
            } else {
              items.push({ label: item.label, disabled: item.disabled, action: () => item.action(anchorRef) });
            }
          }
        }
        return <CtxMenu x={ctxMenu.x} y={ctxMenu.y} items={items} onClose={closeCtx} />;
      })()}
    </div>
  );
});
