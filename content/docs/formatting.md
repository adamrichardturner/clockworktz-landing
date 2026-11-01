# Formatting

clockwork-tz has a built-in, dependency-free formatter that supports a [date-fns](https://date-fns.org/docs/format)-compatible subset of tokens. It formats an instant as seen in a zone, using that zone's offset at that instant.

```ts
import { format } from 'clockwork-tz'

format('2024-07-15T14:00:00Z', 'Pacific/Chatham', 'yyyy-MM-dd HH:mm xxx')
// '2024-07-16 02:45 +12:45'
```

## `format(instant, zone, pattern?, locale?)`

| Parameter | Type                       | Default                     |
| --------- | -------------------------- | --------------------------- |
| `instant` | `Date \| number \| string` | required                    |
| `zone`    | `string`                   | required                    |
| `pattern` | `string`                   | `'yyyy-MM-dd HH:mm:ss zzz'` |
| `locale`  | `string`                   | `'en'`                      |

`locale` controls month names, weekday names and the AM/PM marker. Digits and token layout always follow the pattern.

```ts
format('2024-07-05T09:05:07Z', 'Europe/Berlin', 'EEEE d. MMMM yyyy', 'de')
// 'Freitag 5. Juli 2024'
```

The same patterns work anywhere a `format` option is accepted, such as `fromUTC`, `interpretLocal` and `convert`:

```ts
import { convert } from 'clockwork-tz'

convert('2024-09-12T10:00:00', 'Europe/London', 'Asia/Kolkata', { format: 'EEE HH:mm' }).local
// 'Thu 14:30'
```

## Tokens

The examples below format `2024-07-05T09:05:07.123Z` in `Asia/Kathmandu` (UTC+05:45), where it's 14:50:07.123 on Friday.

| Token                 | Output                                        | Example                     |
| --------------------- | --------------------------------------------- | --------------------------- |
| `yyyy` `yy` `y`       | Year                                          | `2024` `24` `2024`          |
| `M` `MM`              | Month number                                  | `7` `07`                    |
| `MMM` `MMMM`          | Month name                                    | `Jul` `July`                |
| `d` `dd`              | Day of month                                  | `5` `05`                    |
| `EEE` `EEEE`          | Weekday                                       | `Fri` `Friday`              |
| `H` `HH`              | Hour, 0–23                                    | `14` `14`                   |
| `h` `hh`              | Hour, 1–12                                    | `2` `02`                    |
| `a`                   | Day period                                    | `PM`                        |
| `m` `mm`              | Minute                                        | `50` `50`                   |
| `s` `ss`              | Second                                        | `7` `07`                    |
| `S` `SS` `SSS`        | Fraction of a second                          | `1` `12` `123`              |
| `zzz`                 | Abbreviation                                  | `+0545` (`EDT` in New York) |
| `zzzz`                | Long zone name                                | `Nepal Time`                |
| `x` `xx`              | Offset, basic                                 | `+0545`                     |
| `xxx`                 | Offset, extended                              | `+05:45`                    |
| `xxxx` `xxxxx`        | As `xx` / `xxx`, plus seconds when non-zero   | `+0545` `+05:45`            |
| `X` `XX` … `XXXXX`    | As `x`, but `Z` for UTC                       | `+0545`, or `Z` in UTC      |
| `O`                   | GMT offset, short                             | `GMT+5:45`                  |
| `OOOO`                | GMT offset, long                              | `GMT+05:45`                 |
| `'text'`              | Literal text                                  | `'at'` → `at`               |
| `''`                  | A literal single quote                        | `'`                         |

Any ASCII letter outside a quoted section is treated as a token, so quote words: `"HH:mm 'Uhr'"`. An unsupported token (such as `Q`, `w` or `D`) throws `TimezoneError` rather than producing silently wrong output.

```ts
format('2024-07-05T09:05:07Z', 'UTC', 'Q')
// throws TimezoneError: Unsupported format token "Q" in Q

isValidFormatPattern('yyyy-MM-dd') // true
isValidFormatPattern('yyyy-Q') // false
```

### Offsets with seconds

Before standard time, zones used local mean time with offsets that aren't whole minutes. The 4- and 5-letter `x` forms include seconds when they're non-zero:

```ts
format('1880-01-01T00:00:00Z', 'Europe/Amsterdam', 'xxxxx')
// '+00:17:30'
```

## Predefined patterns

`FORMAT_PATTERNS` holds common patterns, and `formatWithPattern` formats with one by name. These examples format `2024-03-15T14:30:00Z` in `America/Los_Angeles`:

| Name         | Pattern                                    | Output                                                       |
| ------------ | ------------------------------------------ | ------------------------------------------------------------ |
| `default`    | `yyyy-MM-dd HH:mm:ss zzz`                  | `2024-03-15 07:30:00 PDT`                                    |
| `dateOnly`   | `yyyy-MM-dd`                               | `2024-03-15`                                                 |
| `timeOnly`   | `HH:mm:ss`                                 | `07:30:00`                                                   |
| `dateTime`   | `yyyy-MM-dd HH:mm:ss`                      | `2024-03-15 07:30:00`                                        |
| `dateTimeMs` | `yyyy-MM-dd HH:mm:ss.SSS`                  | `2024-03-15 07:30:00.000`                                    |
| `amPm`       | `yyyy-MM-dd h:mm:ss a zzz`                 | `2024-03-15 7:30:00 AM PDT`                                  |
| `human`      | `MMMM d, yyyy 'at' h:mm a zzz`             | `March 15, 2024 at 7:30 AM PDT`                              |
| `short`      | `M/d/yy h:mm a`                            | `3/15/24 7:30 AM`                                            |
| `long`       | `EEEE, MMMM d, yyyy 'at' h:mm:ss a zzzz`   | `Friday, March 15, 2024 at 7:30:00 AM Pacific Daylight Time` |
| `rfc2822`    | `EEE, d MMM yyyy HH:mm:ss xx`              | `Fri, 15 Mar 2024 07:30:00 -0700`                            |
| `iso8601`    | `yyyy-MM-dd'T'HH:mm:ssxxx`                 | `2024-03-15T07:30:00-07:00`                                  |

```ts
import { formatWithPattern, FORMAT_PATTERNS, DEFAULT_FORMAT_PATTERN } from 'clockwork-tz'

formatWithPattern('2024-03-15T14:30:00Z', 'America/Los_Angeles', 'human')
// 'March 15, 2024 at 7:30 AM PDT'

FORMAT_PATTERNS.iso8601 // "yyyy-MM-dd'T'HH:mm:ssxxx"
DEFAULT_FORMAT_PATTERN // 'yyyy-MM-dd HH:mm:ss zzz'
```

## Helpers

### `formatFor(instant, zone, useCase)`

Formats for a common purpose. In `Europe/London`, `2024-03-15T14:30:00Z` gives:

| `useCase`  | Output                          |
| ---------- | ------------------------------- |
| `display`  | `2024-03-15 14:30:00 GMT`       |
| `log`      | `2024-03-15T14:30:00+00:00`     |
| `api`      | `2024-03-15T14:30:00+00:00`     |
| `filename` | `2024-03-15_14-30-00`           |
| `human`    | `March 15, 2024 at 2:30 PM GMT` |

### `formatRange(start, end, zone, options?)`

Formats a range. When both ends fall on the same local day, the date is shown once:

```ts
import { formatRange } from 'clockwork-tz'

formatRange('2024-03-15T14:30:00Z', '2024-03-15T16:00:00Z', 'Europe/London')
// '2024-03-15 14:30 – 16:00 GMT'

formatRange('2024-03-15T14:30:00Z', '2024-03-17T16:00:00Z', 'Europe/London', {
  pattern: 'MMM d HH:mm',
})
// 'Mar 15 14:30 – Mar 17 16:00'
```

| Option      | Default                         | Description                                     |
| ----------- | ------------------------------- | ----------------------------------------------- |
| `pattern`   | `FORMAT_PATTERNS.default`       | Pattern for each end when the days differ       |
| `separator` | `' – '`                         | Text between the two ends                       |
| `sameDay`   | `true`                          | Collapse same-day ranges; `false` always uses `pattern` |

### `formatDuration(start, end, options?)`

The absolute time between two instants in words:

```ts
import { formatDuration } from 'clockwork-tz'

formatDuration('2024-03-15T14:30:00Z', '2024-03-17T16:45:30Z')
// '2 days, 2 hours'

formatDuration('2024-03-15T14:30:00Z', '2024-03-17T16:45:30Z', {
  units: ['hours', 'minutes', 'seconds'],
  precision: 3,
})
// '50 hours, 15 minutes, 30 seconds'
```

| Option      | Default                         | Description                            |
| ----------- | ------------------------------- | -------------------------------------- |
| `units`     | `['days', 'hours', 'minutes']`  | Units to use, largest first            |
| `precision` | `2`                             | Maximum number of units in the output  |

Durations measure elapsed time, so a "day" is always 24 hours, even across a DST change.

### `formatRelative(instant, zone, relativeTo?)`

"2 hours ago" or "in 3 days" for anything within a week; beyond that, the date in `zone`:

```ts
import { formatRelative } from 'clockwork-tz'

const now = '2024-03-15T14:30:00Z'
formatRelative('2024-03-15T12:30:00Z', 'UTC', now) // '2 hours ago'
formatRelative('2024-03-18T14:30:00Z', 'UTC', now) // 'in 3 days'
formatRelative('2024-04-15T14:30:00Z', 'Asia/Tokyo', now) // '2024-04-15'
```

`relativeTo` defaults to the current time.

### `formatNow(zone, pattern?)`

`format(new Date(), zone, pattern)`.

### `formatOffset(offsetMinutes)`

Formats an offset in minutes as `±HH:mm`:

```ts
import { formatOffset } from 'clockwork-tz'

formatOffset(345) // '+05:45'
formatOffset(-570) // '-09:30'
formatOffset(0) // '+00:00'
```

## Versus `Intl.DateTimeFormat`

`Intl.DateTimeFormat` is great for locale-appropriate output ("15/03/2024" vs "3/15/2024"). Use clockwork-tz's formatter when you need an exact, stable layout (logs, filenames, APIs, UI with a fixed design) or tokens `Intl` doesn't give you directly, like `xxx`. The two work together: pass the same zone to both.
