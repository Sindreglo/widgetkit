# WidgetKit

Clean, accessible UI components for React, Vue 3, and vanilla JavaScript. Zero dependencies beyond the framework itself.

## Components

### Scheduler

A resource scheduler for displaying and booking time blocks across multiple resources — rooms, people, equipment.

![](https://raw.githubusercontent.com/Sindreglo/widgetkit/main/scheduler.png)

| Package | Version |
| ------- | ------- |
| [`@widgetkit/scheduler-react`](packages/scheduler-react) | [![npm](https://img.shields.io/npm/v/@widgetkit/scheduler-react)](https://www.npmjs.com/package/@widgetkit/scheduler-react) |
| [`@widgetkit/scheduler-vue`](packages/scheduler-vue) | [![npm](https://img.shields.io/npm/v/@widgetkit/scheduler-vue)](https://www.npmjs.com/package/@widgetkit/scheduler-vue) |
| [`@widgetkit/scheduler-js`](packages/scheduler-js) | [![npm](https://img.shields.io/npm/v/@widgetkit/scheduler-js)](https://www.npmjs.com/package/@widgetkit/scheduler-js) |

---

### Booking

A booking scheduler for displaying available dates and time slots — with per-slot pricing, variable durations, and flexible display modes.

![](https://raw.githubusercontent.com/Sindreglo/widgetkit/main/booking.png)

| Package | Version |
| ------- | ------- |
| [`@widgetkit/booking-react`](packages/booking-react) | [![npm](https://img.shields.io/npm/v/@widgetkit/booking-react)](https://www.npmjs.com/package/@widgetkit/booking-react) |
| [`@widgetkit/booking-vue`](packages/booking-vue) | [![npm](https://img.shields.io/npm/v/@widgetkit/booking-vue)](https://www.npmjs.com/package/@widgetkit/booking-vue) |

---

### Spreadsheet

A full-featured spreadsheet with formula support, cell formatting, merged cells, frozen rows/columns, virtual scrolling, copy/paste, and undo/redo.

![](https://raw.githubusercontent.com/Sindreglo/widgetkit/main/spreadsheet.png)

| Package | Version |
| ------- | ------- |
| [`@widgetkit/spreadsheet-react`](packages/spreadsheet-react) | [![npm](https://img.shields.io/npm/v/@widgetkit/spreadsheet-react)](https://www.npmjs.com/package/@widgetkit/spreadsheet-react) |

---

## Monorepo structure

```
packages/
  core/              # Shared utilities (icons, helpers)
  scheduler/         # Framework-agnostic scheduler core
  scheduler-react/   # React component
  scheduler-vue/     # Vue 3 component
  scheduler-js/      # Vanilla JavaScript component
  booking/           # Framework-agnostic booking core
  booking-react/     # React component
  booking-vue/       # Vue 3 component
  spreadsheet/       # Framework-agnostic spreadsheet core
  spreadsheet-react/ # React component
apps/
  playground-react/  # React dev playground
  playground-vue/    # Vue dev playground
  playground-js/     # Vanilla JS dev playground
```

## Development

```bash
pnpm install
pnpm dev        # Build all packages in watch mode
```

## License

MIT © [Sindre Glomnes](https://github.com/Sindreglo)
