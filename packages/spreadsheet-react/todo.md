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
- [x] `width` — CSS-bredde på komponenten
- [x] `height` — fast høyde i stedet for `maxHeight`
- [x] `className` / `style` — pass-through til root-elementet for custom styling
- [x] `defaultColWidth` — global standard kolonnebredde
- [x] `resizableCols` / `resizableRows` — boolean for å skru av/på resize-håndtak

**Visning**
- [x] `showFormulaBar`
- [x] `showToolbar`
- [x] `showRowNumbers`
- [x] `showColHeaders`
- [ ] `frozenCols` / `frozenRows` — sticky header-rader/-kolonner (prop finnes, ikke implementert)
- [x] `autoExpandRows` / `autoExpandCols` + `expandRowsBy` / `expandColsBy` — auto-utvid ved scroll til kanten

**Redigering & validering**
- [x] `onBeforeEdit(ref, currentValue) → boolean` — avbryt edit programmatisk
- [x] `onValidate(ref, newValue) → string | null` — valider og vis feilmelding

**Seleksjon**
- [x] `selectionMode: 'single' | 'range'` — begrens til enkeltcelle-seleksjon
- [ ] `defaultSelection` / `selection` + `onSelectionChange` — kontrollert seleksjon (selection er ucontrolled i dag)
- [x] `onSelectionChange` callback

**Events**
- [x] `onCellClick(ref, value, event)`
- [x] `onCellDoubleClick(ref, value, event)`
- [x] `onKeyDown(event)` — custom keydown hook

**Kontekstmeny**
- [x] `contextMenuItems` — legg til egne menypunkter
- [x] `showContextMenu: false` — skru av kontekstmenyen helt

**Imperative API (ref)**
- [x] `forwardRef` med metoder:
  - `scrollToCell(ref)`
  - `setSelection(ref)`
  - `startEdit(ref)`
  - `exportCsv()`
  - `getCells()`

**Uncontrolled mode**
- [ ] `defaultCells` / `defaultFormats` / `defaultMerges` — ukontrollert modus uten ekstern state

**Custom rendering**
- [x] `renderCell(ref, value, format) → ReactNode` — custom cell renderer

**Tilgjengelighet**
- [x] `aria-label` på root-elementet
- [x] Forbedret tastaturnavigasjon (Home/End, Ctrl+Home/End, Page Up/Down)

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
