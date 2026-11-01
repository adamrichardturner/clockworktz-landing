# DST gaps & overlaps

When a zone changes its offset, some wall times stop mapping to exactly one instant:

- **Gap (skipped time).** When clocks spring forward, a range of wall times never happens. In New York on 10 March 2024, clocks jumped from 02:00 EST straight to 03:00 EDT, so `02:30` didn't exist.
- **Overlap (repeated time).** When clocks fall back, a range of wall times happens twice. In New York on 3 November 2024, clocks went from 02:00 EDT back to 01:00 EST, so `01:30` happened once in EDT and again an hour later in EST.

`interpretLocal` and `convert` turn wall time into an instant, so they have to decide what to do in these cases. The `disambiguation` option makes that decision explicit, with the same semantics as [Temporal](https://tc39.es/proposal-temporal/docs/zoneddatetime.html#ambiguity-and-disambiguation).

## The four strategies

| Option                   | Skipped time (gap)                  | Repeated time (overlap)     |
| ------------------------ | ----------------------------------- | --------------------------- |
| `compatible` _(default)_ | later instant (pushed past the gap) | earlier instant             |
| `earliest`               | earlier instant (pulled before)     | earlier instant             |
| `latest`                 | later instant                       | later instant               |
| `reject`                 | throws `InvalidTimeError`           | throws `AmbiguousTimeError` |

`compatible` matches what `Date`, most calendars and RFC 5545 (iCalendar) do, which is why it's the default.

## Gaps

For a gap, clockwork-tz computes the instant using the offset in effect **before** and **after** the transition. Pushing forward (`compatible`, `latest`) moves the time later by the length of the gap; pulling back (`earliest`) moves it earlier.

```ts
import { interpretLocal } from 'clockwork-tz'

const wall = '2024-03-10T02:30:00' // skipped in New York

interpretLocal(wall, 'America/New_York').local
// '2024-03-10 03:30:00.000'  (EDT, utc '2024-03-10T07:30:00.000Z')

interpretLocal(wall, 'America/New_York', { disambiguation: 'earliest' }).local
// '2024-03-10 01:30:00.000'  (EST, utc '2024-03-10T06:30:00.000Z')

interpretLocal(wall, 'America/New_York', { disambiguation: 'latest' }).local
// '2024-03-10 03:30:00.000'  (EDT)

interpretLocal(wall, 'America/New_York', { disambiguation: 'reject' })
// throws InvalidTimeError: Invalid time "2024-03-10T02:30:00" in timezone "America/New_York"
```

The shift is always the length of the gap, not a fixed hour. Lord Howe Island moves its clocks by 30 minutes, so `02:15` becomes `02:45`:

```ts
interpretLocal('2024-10-06T02:15:00', 'Australia/Lord_Howe').local
// '2024-10-06 02:45:00.000'  (+11)

interpretLocal('2024-10-06T02:15:00', 'Australia/Lord_Howe', { disambiguation: 'earliest' }).local
// '2024-10-06 01:45:00.000'  (+1030)
```

Gaps can be a whole day. Samoa moved across the international date line at the end of 2011, so Thursday 29 December was followed by Saturday 31 December:

```ts
interpretLocal('2011-12-30T12:00:00', 'Pacific/Apia').local
// '2011-12-31 12:00:00.000'  (+14)

interpretLocal('2011-12-30T12:00:00', 'Pacific/Apia', { disambiguation: 'earliest' }).local
// '2011-12-29 12:00:00.000'  (-10)
```

## Overlaps

In an overlap the wall time is the same either way; what changes is the instant (and the offset).

```ts
import { interpretLocal } from 'clockwork-tz'

const wall = '2024-11-03T01:30:00' // happens twice in New York

interpretLocal(wall, 'America/New_York').utc
// '2024-11-03T05:30:00.000Z'  (EDT, the first 01:30)

interpretLocal(wall, 'America/New_York', { disambiguation: 'earliest' }).utc
// '2024-11-03T05:30:00.000Z'  (EDT)

interpretLocal(wall, 'America/New_York', { disambiguation: 'latest' }).utc
// '2024-11-03T06:30:00.000Z'  (EST, the second 01:30)

interpretLocal(wall, 'America/New_York', { disambiguation: 'reject' })
// throws AmbiguousTimeError: Ambiguous time "2024-11-03T01:30:00" in timezone "America/New_York"
```

The same holds for 30-minute overlaps (Lord Howe), 45-minute offsets (Chatham), two-hour DST (`Antarctica/Troll`) and negative DST (`Europe/Dublin`).

## Field objects

Wall time can be given as fields instead of a string. Omitted time fields default to zero, and months are 1-based:

```ts
interpretLocal({ year: 2024, month: 11, day: 3, hour: 1, minute: 30 }, 'America/New_York', {
  disambiguation: 'latest',
}).utc
// '2024-11-03T06:30:00.000Z'
```

Invalid fields, such as `day: 30` in February or a non-integer, throw `TimezoneError`.

## With `convert`

`convert` passes `disambiguation` through when its input is wall time:

```ts
import { convert } from 'clockwork-tz'

convert('2024-11-03T01:30:00', 'America/New_York', 'Europe/London', {
  disambiguation: 'latest',
}).local
// '2024-11-03 06:30:00.000'
```

When the input is an instant, there's nothing to disambiguate and the option is ignored.

## Choosing a strategy

- **Scheduling something to happen at a wall time** (an alarm, a recurring meeting, a cron-like job): use `compatible`. A 02:30 alarm on a spring-forward night rings at 03:30 rather than not at all, and on a fall-back night it rings once, the first time.
- **Validating user input** in a booking form: use `reject` and ask the user to choose, or show both candidate instants by calling with `earliest` and `latest`.
- **Ranges** (a shift that ends at 01:30 on a fall-back night): use `earliest` for starts and `latest` for ends if you want the longest interval, or the reverse for the shortest.

### Detecting ambiguity yourself

Comparing `earliest` and `latest` tells you whether a wall time is normal, skipped or repeated, without relying on exceptions:

```ts
import { interpretLocal } from 'clockwork-tz'

function classify(wall: string, zone: string): 'normal' | 'skipped' | 'repeated' {
  const early = interpretLocal(wall, zone, { disambiguation: 'earliest' })
  const late = interpretLocal(wall, zone, { disambiguation: 'latest' })
  if (early.utc === late.utc) return 'normal'
  return early.local === late.local ? 'repeated' : 'skipped'
}

classify('2024-03-10T02:30:00', 'America/New_York') // 'skipped'
classify('2024-11-03T01:30:00', 'America/New_York') // 'repeated'
classify('2024-07-01T12:00:00', 'America/New_York') // 'normal'
```

## Errors

`InvalidTimeError` and `AmbiguousTimeError` both extend `TimezoneError`, so one `catch` handles every failure, and `instanceof` tells them apart. See [Errors](./errors.md).
