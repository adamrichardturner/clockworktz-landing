# Transitions & clocks

A **transition** is the moment a zone's offset, DST flag or abbreviation changes: the start or end of DST, or a permanent change of standard time. clockworktz finds transitions exactly, to the second, with both engines.

## Finding transitions

### `getNextTransition(zone, from?)`

The first transition after `from` (default: now), or `null` if there's none in the next two years:

```ts
import { getNextTransition } from 'clockworktz'

getNextTransition('Australia/Lord_Howe', '2024-07-15T14:00:00Z')
// {
//   date: 2024-10-05T15:30:00.000Z,
//   fromOffset: 630,
//   toOffset: 660,
//   isDSTStart: true,
//   isDSTEnd: false,
//   fromAbbreviation: '+1030',
//   toAbbreviation: '+11'
// }

getNextTransition('Asia/Tokyo', '2024-01-01T00:00:00Z') // null: Japan has no DST
```

Offsets are in minutes. Lord Howe's DST is only 30 minutes long, from `+10:30` (630) to `+11:00` (660).

### `getPreviousTransition(zone, from?)`

The most recent transition at or before `from`:

```ts
getPreviousTransition('Australia/Lord_Howe', '2024-07-15T14:00:00Z')
// { date: 2024-04-06T15:00:00.000Z, fromOffset: 660, toOffset: 630, isDSTStart: false, isDSTEnd: true, … }
```

### `getTransitions(zone, from, to)`

Every transition in `[from, to)`:

```ts
import { getTransitions } from 'clockworktz'

getTransitions('Pacific/Chatham', '2024-01-01T00:00:00Z', '2025-01-01T00:00:00Z')
// [
//   { date: 2024-04-06T14:00:00.000Z, fromOffset: 825, toOffset: 765, isDSTEnd: true,
//     fromAbbreviation: '+1345', toAbbreviation: '+1245', … },
//   { date: 2024-09-28T14:00:00.000Z, fromOffset: 765, toOffset: 825, isDSTStart: true,
//     fromAbbreviation: '+1245', toAbbreviation: '+1345', … }
// ]
```

Casablanca, which suspends DST during Ramadan, has its transitions in the "wrong" direction:

```ts
getTransitions('Africa/Casablanca', '2024-01-01T00:00:00Z', '2025-01-01T00:00:00Z').map(t => [
  t.date.toISOString(),
  t.fromOffset,
  t.toOffset,
])
// [
//   ['2024-03-10T02:00:00.000Z', 60, 0],
//   ['2024-04-14T02:00:00.000Z', 0, 60]
// ]
```

### `isNearTransition(instant, zone, engine?, windowHours?)`

Whether a transition happens within `windowHours` (default 24) either side of an instant. Useful for warning users that a scheduled time is close to a clock change:

```ts
import { getCurrentEngine, isNearTransition } from 'clockworktz'

isNearTransition('2024-03-31T00:30:00Z', 'Europe/London') // true
isNearTransition('2024-06-01T00:00:00Z', 'Europe/London') // false

isNearTransition('2024-03-29T00:30:00Z', 'Europe/London', getCurrentEngine(), 72) // true
```

### The `TransitionInfo` type

| Field              | Type      | Description                              |
| ------------------ | --------- | ---------------------------------------- |
| `date`             | `Date`    | Instant of the transition                |
| `fromOffset`       | `number`  | Offset before, in minutes                |
| `toOffset`         | `number`  | Offset from the transition on, in minutes |
| `isDSTStart`       | `boolean` | DST starts here                          |
| `isDSTEnd`         | `boolean` | DST ends here                            |
| `fromAbbreviation` | `string`  | Abbreviation before                      |
| `toAbbreviation`   | `string`  | Abbreviation after                       |

Invalid zones return `null` (or `[]`, or `false`) from these functions rather than throwing.

### How exact is it?

The `embedded-tzdb` engine reads transitions straight from the tzdb. The `system-intl` engine has no transition list, so clockworktz samples each day and bisects to the exact second where the offset, DST flag or abbreviation changes. Both return the same results; the test suite checks they agree.

## Watching for transitions

`watchZoneTransitions(zone, callback)` calls `callback` just after each transition in `zone` happens. Use it to re-render UI that shows an offset or abbreviation, or to reschedule wall-time jobs.

```ts
import { watchZoneTransitions } from 'clockworktz'

const stopWatching = watchZoneTransitions('Europe/London', at => {
  console.log(`London changed offset at ${at.toISOString()}`)
  rerender()
})

// Later
stopWatching()
```

`setTimeout` can't wait more than about 24.8 days (2³¹ − 1 ms). Transitions are usually months apart, so the watcher re-arms itself until the transition arrives rather than firing early or overflowing. Watcher timers are `unref`'d in Node.js, so they don't keep the process alive.

## Ticking clocks

`onTick(callback, granularityMs = 1000)` calls `callback` immediately, then on every multiple of `granularityMs` of **wall-clock** time. A 1000 ms clock ticks exactly on each second instead of drifting the way `setInterval` does.

```ts
import { onTick, format } from 'clockworktz'

const stopTicking = onTick(now => {
  clockElement.textContent = format(now, 'Asia/Kathmandu', 'HH:mm:ss')
}, 1000)

// Every whole minute instead
const stopMinutes = onTick(now => updateAgenda(now), 60_000)
```

Granularity below 100 ms is clamped to 100 ms (with a warning).

## Cleaning up

Each watcher returns a stop function; call it when the component unmounts or the job ends. To stop everything at once, for example in tests or on server shutdown:

```ts
import { cleanupAllWatchers, getWatcherStats } from 'clockworktz'

getWatcherStats() // { transitionWatchers: 2, tickWatchers: 1 }
cleanupAllWatchers()
getWatcherStats() // { transitionWatchers: 0, tickWatchers: 0 }
```

See the [React world clock recipe](./recipes.md#a-live-world-clock-in-react) for a complete component.
