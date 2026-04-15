# @widgetkit/scheduler

Framework-agnostic event type definitions shared by all WidgetKit scheduler packages. This package is a peer dependency of `@widgetkit/scheduler-react` and `@widgetkit/scheduler-vue` — you do not need to install it directly.

## Types

These types are re-exported from the framework-specific packages, so you can import them from wherever is most convenient.

```ts
import type {
  ItemCreateDetail,
  ItemClickDetail,
  ItemDblClickDetail,
  ItemHoverDetail,
  ItemContextMenuDetail,
  ItemDragStartDetail,
  ItemDragEndDetail,
  ItemResizeStartDetail,
  ItemResizeEndDetail,
} from '@widgetkit/scheduler';
```

| Type | Shape |
|---|---|
| `ItemCreateDetail` | `{ resourceId: string; start: Date; end: Date }` |
| `ItemClickDetail` | `{ item: TimelineItem }` |
| `ItemDblClickDetail` | `{ item: TimelineItem }` |
| `ItemHoverDetail` | `{ item: TimelineItem; type: 'enter' \| 'leave' }` |
| `ItemContextMenuDetail` | `{ item: TimelineItem; x: number; y: number }` |
| `ItemDragStartDetail` | `{ item: TimelineItem }` |
| `ItemDragEndDetail` | `{ item: TimelineItem; resourceId: string; start: Date; end: Date }` |
| `ItemResizeStartDetail` | `{ item: TimelineItem }` |
| `ItemResizeEndDetail` | `{ item: TimelineItem; start: Date; end: Date }` |
