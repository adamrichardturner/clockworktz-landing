# Errors

Everything clockwork-tz throws is a `TimezoneError`. Two subclasses report DST problems when you ask for them with `disambiguation: 'reject'`.

```text
Error
└── TimezoneError
    ├── InvalidTimeError     a wall time that was skipped (DST gap)
    └── AmbiguousTimeError   a wall time that happened twice (DST overlap)
```

| Error                | Thrown when                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `TimezoneError`      | An invalid zone, unparseable input, an invalid date (`2024-02-30`), an unsupported format token, invalid options or invalid tzdb data |
| `InvalidTimeError`   | `disambiguation: 'reject'` and the wall time falls in a gap                                  |
| `AmbiguousTimeError` | `disambiguation: 'reject'` and the wall time falls in an overlap                             |

```ts
import { interpretLocal, TimezoneError, InvalidTimeError, AmbiguousTimeError } from 'clockwork-tz'

function toInstant(wall: string, zone: string) {
  try {
    return interpretLocal(wall, zone, { disambiguation: 'reject' }).utc
  } catch (error) {
    if (error instanceof InvalidTimeError) {
      return { problem: 'That time is skipped by a clock change. Choose another.' }
    }
    if (error instanceof AmbiguousTimeError) {
      return { problem: 'That time happens twice. Which one did you mean?' }
    }
    if (error instanceof TimezoneError) {
      return { problem: error.message }
    }
    throw error // not from clockwork-tz
  }
}
```

## Messages

Messages include the offending input:

```text
TimezoneError: Invalid timezone: Mars/Base
TimezoneError: Invalid ISO date string: 2024-07-15T14:00:00
TimezoneError: Invalid local time "2024-02-30T10:00:00"
TimezoneError: Unsupported format token "Q" in Q
TimezoneError: The data and manifestURL options require engine: 'embedded-tzdb'
InvalidTimeError: Invalid time "2024-03-10T02:30:00" in timezone "America/New_York"
AmbiguousTimeError: Ambiguous time "2024-11-03T01:30:00" in timezone "America/New_York"
```

When parsing wraps a lower-level failure, the original error is available as `error.cause`.

## Functions that don't throw

Predicates and lookups return a neutral value instead:

| Function                                   | For an invalid zone or input |
| ------------------------------------------ | ---------------------------- |
| `isValidTimeZone`                          | `false`                      |
| `isDST`                                    | `false`                      |
| `isParseable`, `isValidFormatPattern`      | `false`                      |
| `isValidISOString`, `isValidLocalISOString`| `false`                      |
| `safeParse`                                | result with `isValid: false` |
| `getNextTransition`, `getPreviousTransition` | `null`                     |
| `getTransitions`                           | `[]`                         |
| `isNearTransition`                         | `false`                      |
| `watchZoneTransitions`                     | a no-op stop function (and a console warning) |

## Updates never throw

Network and verification failures during [signed updates](./engines.md#signed-updates) are logged with `console.warn` and the current data is kept. `initClockworkTZ` only throws, synchronously, for invalid options.
