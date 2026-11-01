# Parsing

clockworktz parses ISO 8601 strictly. Strings without an offset are read in an explicit `defaultTimezone` (`UTC` unless you say otherwise), **never** in the timezone of the host. That rules out the classic bug where `new Date('2024-07-15T14:00:00')` means different instants on different machines.

```ts
import { parse } from 'clockworktz'

parse('2024-07-15T14:00:00+05:45')
// { date: 2024-07-15T08:15:00.000Z, hasTimezone: true, original: '2024-07-15T14:00:00+05:45', isValid: true }

parse('2024-07-15T14:00:00', { defaultTimezone: 'Asia/Tokyo' })
// { date: 2024-07-15T05:00:00.000Z, hasTimezone: false, original: '2024-07-15T14:00:00', isValid: true }
```

## What's accepted

| Input                            | Read as                                   |
| -------------------------------- | ----------------------------------------- |
| `2024-07-15T14:00:00Z`           | Instant (UTC)                             |
| `2024-07-15T14:00:00+05:45`      | Instant with offset                       |
| `2024-07-15T14:00:00-0330`       | Instant with basic offset                 |
| `2024-07-15T14:00:00+00:19:32`   | Instant with an offset that has seconds   |
| `2024-07-15T14:00-03`            | Instant with an hours-only offset         |
| `2024-07-15 14:00+05:45`         | A space instead of `T`, seconds optional  |
| `2024-07-15T14:00:00.250`        | Wall time in `defaultTimezone`            |
| `2024-07-15 14:00`               | Wall time, space and no seconds           |
| `2024-07-15`                     | Midnight wall time in `defaultTimezone`   |

Fractions of a second may have 1 to 9 digits; the result keeps millisecond precision. Wall times read in a zone with DST use `compatible` [disambiguation](./dst-disambiguation.md). Use `interpretLocal` if you need a different strategy.

## `ParseOptions`

| Option            | Default  | Description                                                                 |
| ----------------- | -------- | --------------------------------------------------------------------------- |
| `strict`          | `true`   | Only accept ISO 8601. Non-strict also accepts other formats the platform can parse, **but only when they carry their own offset** |
| `defaultTimezone` | `'UTC'`  | Zone used to read strings without an offset                                 |

## Functions

### `parse(input, options?)`

Returns a `ParseResult`:

```ts
interface ParseResult {
  date: Date
  hasTimezone: boolean // the input had its own offset
  original: string
  isValid: boolean
}
```

In strict mode an invalid input throws `TimezoneError`; with `strict: false` it returns `isValid: false` and an invalid `Date` instead.

### `parseDate(input, options?)`

Like `parse`, but returns only the `Date`:

```ts
parseDate('2024-07-15 14:00:00Z') // 2024-07-15T14:00:00.000Z
```

### `safeParse(input, options?)` and `isParseable(input, options?)`

Never throw. Both always parse non-strictly (any `strict` option is ignored), so they accept ISO strings and other formats that carry their own offset. An unparseable input gives a result with `isValid: false` (the return type also allows `null`, so use optional chaining):

```ts
import { safeParse, isParseable } from 'clockworktz'

safeParse('next tuesday')?.isValid // false

safeParse('Mon, 15 Jul 2024 14:00:00 GMT')?.date
// 2024-07-15T14:00:00.000Z

isParseable('2024-07-15T14:00:00Z') // true
isParseable('15/07/2024') // false
```

### `parseAny(input, formats?)`

Tries each set of options in turn and returns the first valid result. By default it tries strict ISO, then non-strict:

```ts
parseAny('Mon, 15 Jul 2024 14:00:00 GMT').date // 2024-07-15T14:00:00.000Z
```

Throws `TimezoneError` if nothing matches.

### `parseRange(input, options?)`

Splits on ` to `, ` – `, ` — ` or ` - ` (or your own `separator`) and parses both ends:

```ts
parseRange('2024-01-01 to 2024-01-31')
// { start: 2024-01-01T00:00:00.000Z, end: 2024-01-31T00:00:00.000Z }
```

Throws `TimezoneError` if there aren't exactly two parts or `start` is after `end`.

### `parseTime(input)`

Parses a time of day, `H:mm`, `HH:mm`, `HH:mm:ss` or `HH:mm:ss.SSS`:

```ts
parseTime('09:30') // { hour: 9, minute: 30, second: 0, millisecond: 0 }
parseTime('9:30:15.250') // { hour: 9, minute: 30, second: 15, millisecond: 250 }
```

Fractional seconds must have three digits.

### `parseOffset(input)`

Parses an offset to minutes. Seconds give a fractional result:

```ts
import { parseOffset } from 'clockworktz'

parseOffset('+05:45') // 345
parseOffset('-0330') // -210
parseOffset('+5:30') // 330
parseOffset('+00:19:32') // 19.533333333333335
parseOffset('Z') // 0
parseOffset('UTC') // 0
```

### `parseComponents(input)`

Splits a wall-time string into fields without attaching a zone:

```ts
parseComponents('2024-07-15T14:00:00.250')
// { year: 2024, month: 7, day: 15, hour: 14, minute: 0, second: 0, millisecond: 250 }
```

### `normalize(input)`

Turns any `DateInput` (`Date`, epoch milliseconds or string) into a `Date`, throwing `TimezoneError` for invalid input. Strings go through non-strict parsing, so they must carry an offset.

### `isValidISOString(input)` and `isValidLocalISOString(input)`

Check the two string shapes without parsing them:

```ts
import { isValidISOString, isValidLocalISOString } from 'clockworktz'

isValidISOString('2024-07-15T14:00:00Z') // true: has an offset
isValidISOString('2024-07-15T14:00:00') // false
isValidLocalISOString('2024-07-15T14:00:00') // true: wall time
```

## Validation

Dates are validated, not rolled over. `2024-02-30` is an error, not 1 March:

```ts
interpretLocal('2024-02-30T10:00:00', 'UTC')
// throws TimezoneError: Invalid local time "2024-02-30T10:00:00"
```
