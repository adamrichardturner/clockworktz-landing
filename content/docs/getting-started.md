# Installation & quick start

## Install

```bash
npm install clockworktz
```

Or with another package manager:

```bash
pnpm add clockworktz
yarn add clockworktz
bun add clockworktz
```

**Requirements:** Node.js 20 or later, or any browser with `Intl.DateTimeFormat` time zone support. There are no runtime dependencies.

## Import

The package ships ES modules and CommonJS with TypeScript types for both.

```ts
// ESM
import { fromUTC, convert, format } from 'clockworktz'

// CommonJS
const { fromUTC, convert, format } = require('clockworktz')
```

There are two entry points:

| Import             | What it contains                                             | Size (gzipped) |
| ------------------ | ------------------------------------------------------------ | -------------- |
| `clockworktz`      | The whole API, using the platform's `Intl` data by default   | ~21 kB         |
| `clockworktz/tzdb` | A compiled IANA tzdb snapshot for the `embedded-tzdb` engine | ~30 kB         |

The package is marked `sideEffects: false`, so bundlers drop anything you don't import: an app that only imports `fromUTC` ships about 11 kB minified. The tzdb snapshot is only included if you import `clockworktz/tzdb`.

## Quick start

No setup is needed: the default `system-intl` engine is ready as soon as you import the library.

### Show an instant in a zone

```ts
import { fromUTC } from 'clockworktz'

fromUTC('2024-07-15T14:00:00Z', 'Australia/Lord_Howe')
// {
//   utc: '2024-07-15T14:00:00.000Z',
//   zone: 'Australia/Lord_Howe',
//   local: '2024-07-16 00:30:00.000',
//   offsetMinutes: 630,
//   isDST: false,
//   abbreviation: '+1030',
//   source: 'system-intl'
// }
```

### Convert wall time between zones

A string without an offset is wall-clock time in the source zone:

```ts
import { convert } from 'clockworktz'

convert('2024-07-15T16:30:00', 'Asia/Kathmandu', 'America/St_Johns').local
// '2024-07-15 08:15:00.000'
```

### Format

```ts
import { format } from 'clockworktz'

format('2024-07-15T14:00:00Z', 'Pacific/Chatham', 'yyyy-MM-dd HH:mm xxx')
// '2024-07-16 02:45 +12:45'
```

### Interpret a local time that DST skipped

```ts
import { interpretLocal } from 'clockworktz'

// 02:30 doesn't exist in New York on 10 March 2024: it resolves to 03:30 EDT
interpretLocal('2024-03-10T02:30:00', 'America/New_York').local
// '2024-03-10 03:30:00.000'
```

## What you can pass in

**Instants** (a single point in time) can be:

- a `Date`
- epoch milliseconds, such as `1721052000000`
- an ISO 8601 string **with an offset**: `Z`, `+05:45`, `-0330`, or even `+00:19:32`

**Wall times** (what a clock on the wall shows, with no zone attached) can be:

- an ISO string **without an offset**, such as `'2024-03-10T02:30:00'`. A space works in place of `T`, and seconds are optional: `'2024-03-10 02:30'`
- an object of fields: `{ year, month, day, hour?, minute?, second?, millisecond? }`

**Zones** can be:

- IANA identifiers, such as `'America/New_York'`
- IANA links, such as `'Asia/Calcutta'` (canonicalized to `Asia/Kolkata` where the engine knows the link)
- fixed offsets, such as `'+05:30'`, `'-0930'` or `'+05'`

> [!TIP]
> Months are 1-based in field objects (`month: 3` is March), unlike `Date#getMonth()`.

## Optional: pin the timezone database

By default clockworktz uses the runtime's timezone data. To get identical results on every platform, switch to the embedded engine once at startup:

```ts
import { initClockworkTZ } from 'clockworktz'
import { tzdb } from 'clockworktz/tzdb'

await initClockworkTZ({ engine: 'embedded-tzdb', data: tzdb })
```

See [Engines & tzdb data](./engines.md) for when you'd want this, and how to keep the data fresh with signed updates.

## Next steps

- [Core concepts](./core-concepts.md): instants, wall time, and the `ClockworkTime` result
- [DST gaps & overlaps](./dst-disambiguation.md): the `disambiguation` option
- [Recipes](./recipes.md): meeting planners, world clocks, timezone pickers and more
