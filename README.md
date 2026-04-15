# WidgetKit

Clean, accessible UI components for React and Vue 3. Zero dependencies beyond the framework itself.

## Components

### Scheduler

A resource scheduler for displaying and booking time blocks across multiple resources — rooms, people, equipment.

![](https://raw.githubusercontent.com/Sindreglo/widgetkit/main/scheduler.png)

| Package | Version |
| ------- | ------- |
| [`@widgetkit/scheduler-react`](packages/scheduler-react) | [![npm](https://img.shields.io/npm/v/@widgetkit/scheduler-react)](https://www.npmjs.com/package/@widgetkit/scheduler-react) |
| [`@widgetkit/scheduler-vue`](packages/scheduler-vue) | [![npm](https://img.shields.io/npm/v/@widgetkit/scheduler-vue)](https://www.npmjs.com/package/@widgetkit/scheduler-vue) |

---

### Booking

A booking scheduler for displaying available dates and time slots — with per-slot pricing, variable durations, and flexible display modes.

![](https://raw.githubusercontent.com/Sindreglo/widgetkit/main/booking.png)

| Package | Version |
| ------- | ------- |
| [`@widgetkit/booking-react`](packages/booking-react) | [![npm](https://img.shields.io/npm/v/@widgetkit/booking-react)](https://www.npmjs.com/package/@widgetkit/booking-react) |
| [`@widgetkit/booking-vue`](packages/booking-vue) | [![npm](https://img.shields.io/npm/v/@widgetkit/booking-vue)](https://www.npmjs.com/package/@widgetkit/booking-vue) |

---

## Monorepo structure

```
packages/
  core/              # Shared utilities (icons, helpers)
  scheduler/         # Framework-agnostic scheduler core
  scheduler-react/   # React component
  scheduler-vue/     # Vue 3 component
  booking/           # Framework-agnostic booking core
  booking-react/     # React component
  booking-vue/       # Vue 3 component
apps/
  playground-react/  # React dev playground
  playground-vue/    # Vue dev playground
```

## Development

```bash
pnpm install
pnpm dev        # Build all packages in watch mode
```

## License

MIT © [Sindre Glomnes](https://github.com/Sindreglo)
