# Spreadsheet TODO

## Must-haves

### Kjernefunksjonalitet (ferdig)
- [x] Keyboard navigation (arrow keys, Tab, Enter)
- [x] Cell editing (inline + formula bar)
- [x] Formula support (`=SUM`, `=IF`, etc.)
- [x] Copy/paste — `Ctrl+C/V/X` + context menu, støtter range
- [x] Undo/redo — `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y`, 50-stegs historikk
- [x] Column resize + row resize
- [x] Multi-cell range selection (drag, Shift+click, Shift+arrow)
- [x] Row/column header click to select entire row/col
- [x] Context menu (cut, copy, paste, insert/delete row/col)
- [x] Read-only mode
- [x] `onCellChange` / `onCellsChange` callbacks
- [x] CSV export

### API / konfigurering (mangler)

**Layout & dimensjoner**
- [ ] `width` — CSS-bredde på komponenten (i dag bare `maxHeight`)
- [ ] `height` — fast høyde i stedet for `maxHeight`
- [ ] `className` / `style` — pass-through til root-elementet for custom styling
- [ ] `defaultColWidth` — global standard kolonnebredde (nå hardkodet til 100 px)
- [ ] `resizableCols` / `resizableRows` — boolean for å skru av/på resize-håndtak

**Visning**
- [x] `showFormulaBar`
- [x] `showToolbar`
- [x] `showRowNumbers`
- [x] `showColHeaders`
- [ ] `frozenCols` / `frozenRows` — sticky header-rader/-kolonner (prop finnes, ikke implementert)

**Redigering & validering**
- [ ] `onBeforeEdit(ref, currentValue) → boolean` — avbryt edit programmatisk
- [ ] `onValidate(ref, newValue) → string | null` — valider og vis feilmelding

**Seleksjon**
- [ ] `selectionMode: 'single' | 'range'` — begrens til enkeltcelle-seleksjon
- [ ] `defaultSelection` / `selection` + `onSelectionChange` — kontrollert seleksjon (selection er ucontrolled i dag)
- [x] `onSelectionChange` callback

**Events**
- [ ] `onCellClick(ref, value, event)`
- [ ] `onCellDoubleClick(ref, value, event)`
- [ ] `onKeyDown(event)` — custom keydown hook

**Kontekstmeny**
- [ ] `contextMenuItems` — legg til egne menypunkter
- [ ] `showContextMenu: false` — skru av kontekstmenyen helt

**Imperative API (ref)**
- [ ] `useSpreadsheetRef()` / `forwardRef` med metoder:
  - `scrollToCell(ref)`
  - `setSelection(ref)`
  - `startEdit(ref)`
  - `exportCsv()`
  - `getCells()`

**Uncontrolled mode**
- [ ] `defaultCells` / `defaultFormats` / `defaultMerges` — ukontrollert modus uten ekstern state

**Custom rendering**
- [ ] `renderCell(ref, value, format) → ReactNode` — custom cell renderer

**Tilgjengelighet**
- [ ] `aria-label` på root-elementet
- [ ] Forbedret tastaturnavigasjon (Home/End, Ctrl+Home/End, Page Up/Down)

## Nice-to-haves

- [x] Cell formatting (bold, italic, text color, background color)
- [x] Number formatting (currency, %, decimal places, date)
- [ ] Frozen rows/cols (sticky while scrolling)
- [ ] Fill handle (drag corner to auto-fill a range)
- [ ] Sort/filter by column
- [x] Merge cells
- [ ] Column/row hide & unhide
- [ ] Find & replace
- [ ] Multiple sheets (tabs)
- [ ] Undo stack size limit + configurable
- [ ] Keyboard shortcut hints in context menu
- [ ] Touch / mobile support
- [ ] Dark mode via CSS variables
- [ ] Column type hints (text, number, date) for formatting/validation
