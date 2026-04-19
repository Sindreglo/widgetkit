# Spreadsheet TODO

## Must-haves

- [x] Keyboard navigation (arrow keys, Tab, Enter)
- [x] Cell editing (inline + formula bar)
- [x] Formula support (`=SUM`, `=IF`, etc.)
- [ ] Copy/paste — context menu cut/copy/paste fungerer (enkeltcelle), men mangler `Ctrl+C/V` og range-paste
- [ ] Undo/redo
- [x] Column resize + row resize
- [x] Multi-cell range selection (drag, Shift+click, Shift+arrow)
- [x] Row/column header click to select entire row/col
- [x] Context menu (cut, copy, paste, insert/delete row/col)
- [x] Read-only mode
- [x] `onCellChange` / `onCellsChange` callbacks
- [x] CSV export (i `@widgetkit/spreadsheet` core)

## Nice-to-haves

- [ ] Cell formatting (bold, italic, text color, background color)
- [ ] Number formatting (currency, %, decimal places, date)
- [ ] Frozen rows/cols (sticky while scrolling)
- [ ] Fill handle (drag corner to auto-fill a range)
- [ ] Sort/filter by column
- [ ] Merge cells
- [ ] Column/row hide & unhide
- [ ] Find & replace
- [ ] Multiple sheets (tabs)
- [ ] Undo stack size limit + configurable
- [ ] Keyboard shortcut hints in context menu
- [ ] Touch / mobile support
- [ ] Dark mode via CSS variables
- [ ] `onSelectionChange` callback
- [ ] Column type hints (text, number, date) for formatting/validation
