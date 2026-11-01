# Core concepts

Most timezone bugs come from mixing up two different things: an **instant** and a **wall time**. clockworktz keeps them separate, and every function tells you which one it expects.

## Instants and wall time

An **instant** is a single point on the global timeline. `2024-07-15T14:00:00Z` is the same instant everywhere on Earth. In clockworktz an instant is a `Date`, epoch milliseconds, or an ISO string that carries an offset (`Z`, `+05:45`, `-0330`).

A **wall time** is what a clock on the wall shows: `2024-07-15 16:30`. On its own it is not a point in time. It only becomes one when you say which zone's wall it hangs on, and even then DST can make it [ambiguous or impossible](./dst-disambiguation.md). In clockworktz a wall time is an ISO string **without** an offset, or an object of fields.

| Function                                | Takes        | Returns                              |
| --------------------------------------- | ------------ | ------------------------------------ |
| `fromUTC(instant, zone)`                | an instant   | that instant as seen in `zone`       |
| `interpretLocal(wallTime, zone)`        | a wall time  | the instant it names in `zone`       |
| `convert(input, fromZone, toZone)`      | either       | the result as seen in `toZone`       |
| `format(instant, zone, pattern)`        | an instant   | a string                             |
| `getZoneInfo(instant, zone)`            | an instant   | the offset, DST flag and abbreviation in effect |

`convert` looks at its input to decide which it is: a string without an offset is read as wall time in `fromZone`, and anything else (a `Date`, a number, or a string with an offset) is treated as an instant and `fromZone` doesn't affect the result.

```ts
import { convert } from 'clockworktz'

// Wall time: 09:00 in Paris
convert('2024-07-15T09:00:00', 'Europe/Paris', 'Asia/Tokyo').local
// '2024-07-15 16:00:00.000'

// Instant: 09:00 UTC, whatever fromZone says
convert('2024-07-15T09:00:00Z', 'Europe/Paris', 'Asia/Tokyo').local
// '2024-07-15 18:00:00.000'
```

## The `ClockworkTime` result

`fromUTC`, `interpretLocal` and `convert` all return a `ClockworkTime`:

```ts
interface ClockworkTime {
  /** ISO 8601 instant in UTC with Z suffix */
  utc: string
  /** IANA timezone identifier (e.g. "Australia/Lord_Howe") */
  zone: string
  /** Formatted local civil time */
  local: string
  /** Offset from UTC in minutes (e.g. 630 for +10:30) */
  offsetMinutes: number
  /** Whether this time is during daylight saving time */
  isDST: boolean
  /** Timezone abbreviation in effect (e.g. "EST", "+0545") */
  abbreviation: string
  /** The engine that produced this result */
  source: 'system-intl' | 'embedded-tzdb'
  /** TZDB version (only with the embedded-tzdb engine) */
  tzdbVersion?: string
}
```

A few details worth knowing:

- `utc` is always a full ISO string with milliseconds and `Z`, so it round-trips through `new Date(utc)`.
- `local` uses the pattern `yyyy-MM-dd HH:mm:ss.SSS` unless you pass `format` (see [Formatting](./formatting.md)).
- `offsetMinutes` is a whole number except for historical [local mean time](./unusual-zones.md#local-mean-time), where it can be fractional (Amsterdam in 1850 was `+17.5` minutes).
- `abbreviation` comes from the engine. Many zones have no letter abbreviation in the IANA data and use numeric ones like `+1030`.

### Options

All three functions take an optional last argument:

| Option           | Applies to                    | Description                                                  |
| ---------------- | ----------------------------- | ------------------------------------------------------------ |
| `format`         | all                           | Pattern for `local`, such as `'EEE HH:mm'`                    |
| `locale`         | all                           | Locale for month, weekday and day-period names (default `en`) |
| `disambiguation` | `interpretLocal`, `convert`   | `compatible` (default), `earliest`, `latest` or `reject`      |

```ts
convert('2024-07-15T09:00:00', 'America/Los_Angeles', 'Asia/Kathmandu', {
  format: "EEE d MMM, HH:mm 'NPT'",
}).local
// 'Mon 15 Jul, 21:45 NPT'
```

## Host independence

clockworktz never reads a date in the timezone of the machine running the code. That is the most common source of "works on my machine" timezone bugs: `new Date('2024-07-15T14:00:00')` means 14:00 in whatever zone the server or the user's laptop happens to be in.

- Functions that take an instant reject strings without an offset rather than guessing.
- [Parsing](./parsing.md) functions read offset-less strings in an explicit `defaultTimezone`, which is `UTC` unless you say otherwise.
- The test suite runs under several host timezones (`UTC`, `America/New_York`, `Australia/Lord_Howe`, `Asia/Kathmandu`, `Pacific/Chatham`) to prove it.

```ts
import { fromUTC } from 'clockworktz'

fromUTC('2024-07-15T14:00:00', 'UTC')
// throws TimezoneError: Invalid ISO date string: 2024-07-15T14:00:00
```

If you have a wall time, use `interpretLocal` or `convert` and name its zone.

## Zones

Any function that takes a zone accepts:

- **IANA identifiers** like `Europe/London` or `Pacific/Chatham`.
- **Links** (aliases) like `Asia/Calcutta`, `US/Eastern` or `Europe/Kiev`. Use `canonicalizeTimeZone` to get the primary name.
- **Fixed offsets** in `±HH:mm`, `±HHmm` or `±HH` form, like `+05:30`, `-0930` or `+05`. These never have DST.

Names are matched case-insensitively, and `canonicalizeTimeZone` returns the standard spelling.

```ts
import { isValidTimeZone, canonicalizeTimeZone, getUserTimeZone } from 'clockworktz'

isValidTimeZone('Asia/Calcutta') // true
isValidTimeZone('+05:30') // true
isValidTimeZone('-0930') // true
isValidTimeZone('Nope/Zone') // false

canonicalizeTimeZone('Asia/Calcutta') // 'Asia/Kolkata'
canonicalizeTimeZone('Europe/Kiev') // 'Europe/Kyiv'
canonicalizeTimeZone('us/eastern') // 'America/New_York'
canonicalizeTimeZone('+0530') // '+05:30'

getUserTimeZone() // the runtime's zone, e.g. 'America/Los_Angeles' (falls back to 'UTC')
```

An invalid zone throws a [`TimezoneError`](./errors.md), except in the predicates `isValidTimeZone` and `isDST`, which return `false`.

> [!WARNING]
> `Etc/GMT+5` means UTC**−5**. The `Etc` zones follow POSIX, where the sign is inverted. clockworktz handles this correctly, but it surprises people reading the code. Prefer a fixed offset like `-05:00` when you mean a fixed offset.

## Engines

Every result comes from an engine: the default `system-intl` engine uses the runtime's `Intl` data, and the opt-in `embedded-tzdb` engine uses a pinned IANA release. `result.source` tells you which produced it. See [Engines & tzdb data](./engines.md).
