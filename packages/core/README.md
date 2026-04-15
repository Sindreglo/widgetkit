# @widgetkit/core

Shared types and utility functions used across all WidgetKit packages. This package is a peer dependency of the framework-specific packages — you do not need to install it directly unless you are building a custom WidgetKit integration.

## Types

```ts
import type { Resource, TimelineItem } from '@widgetkit/core';
```

### `Resource`

Represents a row in the scheduler — a person, a room, a machine, or any other entity.

```ts
interface Resource {
  id: string;
  name: string;
  avatar?: string; // URL to an avatar image
}
```

### `TimelineItem`

Represents a single event placed on the timeline.

```ts
interface TimelineItem {
  id: string;
  resourceId: string; // Must match a Resource id
  name: string;
  color: string;      // CSS color string, e.g. '#6366f1'
  start: Date;
  end: Date;
  description?: string;
}
```

## Utilities

These are used internally by the scheduler packages. You can import them if you are building a custom integration.

```ts
import { timeToPercent, percentToTime, snapToInterval, clamp, assignSubRows } from '@widgetkit/core';
```

| Function | Signature | Description |
|---|---|---|
| `timeToPercent` | `(date, startHour, endHour) => number` | Converts a `Date` to a horizontal position (0–100) within the visible time range. |
| `percentToTime` | `(percent, date, startHour, endHour) => Date` | Converts a horizontal position back to a `Date`. |
| `snapToInterval` | `(date, snapMinutes) => Date` | Snaps a `Date` to the nearest minute interval. |
| `clamp` | `(value, min, max) => number` | Clamps a number between min and max. |
| `assignSubRows` | `(items) => (TimelineItem & { subRow: number })[]` | Resolves overlapping items into sub-rows so they render side by side without overlap. |
