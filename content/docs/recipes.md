# Recipes

Complete patterns for common jobs. Each one uses only the public API.

## Schedule a meeting across zones

Store the meeting as an instant (UTC), created from the organiser's wall time, then show it in each attendee's zone.

```ts
import { convert, interpretLocal } from 'clockwork-tz'

// The organiser picks 10:00 on 12 September in London
const meeting = interpretLocal('2024-09-12T10:00:00', 'Europe/London')
meeting.utc // '2024-09-12T09:00:00.000Z' — store this

for (const zone of ['America/Los_Angeles', 'Asia/Kolkata', 'Australia/Sydney']) {
  console.log(zone, convert(meeting.utc, 'UTC', zone, { format: 'EEE HH:mm' }).local)
}
// America/Los_Angeles Thu 02:00
// Asia/Kolkata Thu 14:30
// Australia/Sydney Thu 19:00
```

> [!TIP]
> Store instants, not wall times, for one-off events. For **recurring** events ("every Monday at 09:00 in Berlin"), store the wall time and the zone, and compute each occurrence with `interpretLocal`. That way the meeting stays at 09:00 local time when Berlin's DST starts or ends.

## A recurring event that survives DST

```ts
import { interpretLocal } from 'clockwork-tz'

function weeklyOccurrences(startDate: string, time: string, zone: string, count: number) {
  const [year, month, day] = startDate.split('-').map(Number) as [number, number, number]
  const [hour, minute] = time.split(':').map(Number) as [number, number]
  return Array.from({ length: count }, (_, week) => {
    // Calendar arithmetic on the date, in UTC so it never shifts
    const date = new Date(Date.UTC(year, month - 1, day + week * 7))
    return interpretLocal(
      { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour, minute },
      zone
    ).utc
  })
}

// Berlin's DST started on 31 March 2024
weeklyOccurrences('2024-03-25', '09:00', 'Europe/Berlin', 3)
// [
//   '2024-03-25T08:00:00.000Z',  // 09:00 CET  (UTC+1)
//   '2024-04-01T07:00:00.000Z',  // 09:00 CEST (UTC+2)
//   '2024-04-08T07:00:00.000Z'
// ]
```

Adding 7 × 24 hours to the first instant instead would have moved the second and third meetings to 10:00.

## A live world clock in React

`onTick` keeps the seconds exact, and `watchZoneTransitions` re-renders the moment a zone changes its offset.

```tsx
'use client'
import { useEffect, useState } from 'react'
import { format, onTick, watchZoneTransitions } from 'clockwork-tz'

export function WorldClock({ zone }: { zone: string }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const stopTicking = onTick(setNow, 1000)
    const stopWatching = watchZoneTransitions(zone, at => setNow(at))
    return () => {
      stopTicking()
      stopWatching()
    }
  }, [zone])

  return (
    <figure>
      <figcaption>{zone}</figcaption>
      <time dateTime={now.toISOString()}>{format(now, zone, 'HH:mm:ss')}</time>
      <span>{format(now, zone, 'zzz xxx')}</span>
    </figure>
  )
}
```

> [!NOTE]
> With server rendering, the server's "now" and the browser's "now" differ by a few hundred milliseconds, which causes a hydration mismatch on the seconds. Render a placeholder until the component mounts, or add `suppressHydrationWarning` to the `<time>` element.

## A timezone picker

Offsets depend on the date, so list zones for the date the user is scheduling, and default to their own zone.

```tsx
'use client'
import { useMemo } from 'react'
import { getUserTimeZone, listTimeZones } from 'clockwork-tz'

export function TimeZoneSelect({
  value = getUserTimeZone(),
  at = new Date(),
  onChange,
}: {
  value?: string
  at?: Date
  onChange: (zone: string) => void
}) {
  const groups = useMemo(() => {
    const byRegion = new Map<string, { value: string; label: string }[]>()
    for (const zone of listTimeZones({ labelStyle: 'offset', at })) {
      const region = zone.value.includes('/') ? zone.value.split('/')[0]! : 'Other'
      byRegion.set(region, [...(byRegion.get(region) ?? []), zone])
    }
    return [...byRegion].sort(([a], [b]) => a.localeCompare(b))
  }, [at])

  return (
    <select value={value} onChange={event => onChange(event.target.value)}>
      {groups.map(([region, zones]) => (
        <optgroup key={region} label={region}>
          {zones.map(zone => (
            <option key={zone.value} value={zone.value}>
              {zone.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
```

## Validate a booking form

Reject skipped and repeated times instead of silently moving them, and tell the user what happened.

```ts
import { interpretLocal, AmbiguousTimeError, InvalidTimeError } from 'clockwork-tz'

export function validateSlot(wall: string, zone: string) {
  try {
    return { ok: true, utc: interpretLocal(wall, zone, { disambiguation: 'reject' }).utc } as const
  } catch (error) {
    if (error instanceof InvalidTimeError) {
      const after = interpretLocal(wall, zone, { disambiguation: 'latest' })
      return { ok: false, reason: `This time is skipped by DST. Did you mean ${after.local.slice(11, 16)}?` } as const
    }
    if (error instanceof AmbiguousTimeError) {
      const first = interpretLocal(wall, zone, { disambiguation: 'earliest' })
      const second = interpretLocal(wall, zone, { disambiguation: 'latest' })
      return {
        ok: false,
        reason: `This time happens twice: ${first.abbreviation} or ${second.abbreviation}.`,
        choices: [first.utc, second.utc],
      } as const
    }
    throw error
  }
}

validateSlot('2024-03-10T02:30:00', 'America/New_York')
// { ok: false, reason: 'This time is skipped by DST. Did you mean 03:30?' }

validateSlot('2024-11-03T01:30:00', 'America/New_York')
// { ok: false, reason: 'This time happens twice: EDT or EST.',
//   choices: ['2024-11-03T05:30:00.000Z', '2024-11-03T06:30:00.000Z'] }
```

## Log timestamps on a server

Logs read best in one zone, with the offset written out so nobody has to guess:

```ts
import { formatFor } from 'clockwork-tz'

const stamp = () => formatFor(new Date(), 'Europe/London', 'log')
console.log(`[${stamp()}] server started`)
// [2024-03-15T14:30:00+00:00] server started
```

For filenames, `formatFor(instant, zone, 'filename')` gives `2024-03-15_14-30-00`, with no colons or spaces.

## Show "your time" next to an event's time

```ts
import { format, getUserTimeZone } from 'clockwork-tz'

function eventTimes(utc: string, eventZone: string) {
  const viewer = getUserTimeZone()
  const there = format(utc, eventZone, "EEE d MMM, HH:mm zzz")
  return viewer === eventZone ? there : `${there} (${format(utc, viewer, 'HH:mm zzz')} your time)`
}
```

## Deterministic results on server and client

When a server validates what a browser computed, both must use the same rules. Pin the tzdb on both sides:

```ts
// shared/time.ts — import this before anything else uses clockwork-tz
import { initClockworkTZ, DEFAULT_MANIFEST_URL } from 'clockwork-tz'
import { tzdb } from 'clockwork-tz/tzdb'

export const ready = initClockworkTZ({
  engine: 'embedded-tzdb',
  data: tzdb,
  manifestURL: DEFAULT_MANIFEST_URL,
})
```

The bundled snapshot is usable immediately. Signed updates arrive in the background, and `tzdbVersion()` tells you which release produced a result, so you can include it in API payloads if the two sides must match exactly.

## Testing code that depends on "now"

Most functions take an explicit instant, so pass one instead of relying on the clock. For code that calls `formatNow` or `onTick`, use fake timers, and clean up watchers between tests:

```ts
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanupAllWatchers } from 'clockwork-tz'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2024-03-10T06:59:59Z')) // one second before New York's DST
})

afterEach(() => {
  cleanupAllWatchers()
  vi.useRealTimers()
})
```

Run your suite under a few host timezones too (`TZ=Australia/Lord_Howe npm test`). clockwork-tz doesn't depend on the host zone, but your own code might.
