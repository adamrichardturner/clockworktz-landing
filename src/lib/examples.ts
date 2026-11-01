// Snippets shown on the landing page. Every output comment is the real result
// from clockworktz 1.0.2; keep them in sync with content/docs.

export const heroExample = `
import { fromUTC, convert, format } from 'clockworktz'

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

// Strings without an offset are wall time in the source zone
convert('2024-07-15T16:30:00', 'Asia/Kathmandu', 'America/St_Johns').local
// '2024-07-15 08:15:00.000'

format('2024-07-15T14:00:00Z', 'Pacific/Chatham', 'yyyy-MM-dd HH:mm xxx')
// '2024-07-16 02:45 +12:45'
`

export const exampleTabs = [
  {
    id: 'convert',
    label: 'Convert',
    file: 'meeting.ts',
    code: `
import { convert, fromUTC } from 'clockworktz'

// 10:00 in London: what is that for everyone else?
const attendees = ['America/Los_Angeles', 'Asia/Kolkata', 'Australia/Sydney']

for (const zone of attendees) {
  const { local } = convert('2024-09-12T10:00:00', 'Europe/London', zone, {
    format: 'EEE HH:mm',
  })
  console.log(zone, local)
}
// America/Los_Angeles Thu 02:00
// Asia/Kolkata        Thu 14:30
// Australia/Sydney    Thu 19:00

// Instants work too: Date, epoch milliseconds, or ISO strings with an offset
fromUTC(new Date('2024-07-15T14:00:00Z'), 'Asia/Kolkata').local
// '2024-07-15 19:30:00.000'

// Fixed offsets are zones as well
fromUTC('2024-07-15T14:00:00Z', '+05:30').local
// '2024-07-15 19:30:00.000'
`,
  },
  {
    id: 'dst',
    label: 'DST gaps & overlaps',
    file: 'disambiguation.ts',
    code: `
import { interpretLocal, AmbiguousTimeError } from 'clockworktz'

// 01:30 happens twice in New York on 3 November 2024
interpretLocal('2024-11-03T01:30:00', 'America/New_York').utc
// '2024-11-03T05:30:00.000Z'  (EDT, the earlier instant)

interpretLocal('2024-11-03T01:30:00', 'America/New_York', {
  disambiguation: 'latest',
}).utc
// '2024-11-03T06:30:00.000Z'  (EST)

// Or refuse to guess
try {
  interpretLocal('2024-11-03T01:30:00', 'America/New_York', {
    disambiguation: 'reject',
  })
} catch (error) {
  error instanceof AmbiguousTimeError // true
}

// Wall time as fields works the same way
interpretLocal({ year: 2024, month: 3, day: 10, hour: 2, minute: 30 }, 'America/New_York').local
// '2024-03-10 03:30:00.000'  (02:30 was skipped)
`,
  },
  {
    id: 'format',
    label: 'Format',
    file: 'format.ts',
    code: `
import { format, formatWithPattern, formatRange, formatRelative } from 'clockworktz'

format('2024-07-05T09:05:07Z', 'Asia/Kathmandu', "EEEE d MMMM, HH:mm 'at' xxx")
// 'Friday 5 July, 14:50 at +05:45'

format('2024-07-05T09:05:07Z', 'America/New_York', 'h:mm a zzz (zzzz)')
// '5:05 AM EDT (Eastern Daylight Time)'

format('2024-07-05T09:05:07Z', 'Europe/Berlin', 'EEEE d. MMMM yyyy', 'de')
// 'Freitag 5. Juli 2024'

formatWithPattern('2024-03-15T14:30:00Z', 'America/Los_Angeles', 'rfc2822')
// 'Fri, 15 Mar 2024 07:30:00 -0700'

formatRange('2024-03-15T14:30:00Z', '2024-03-15T16:00:00Z', 'Europe/London')
// '2024-03-15 14:30 – 16:00 GMT'

formatRelative('2024-03-15T12:30:00Z', 'UTC', '2024-03-15T14:30:00Z')
// '2 hours ago'
`,
  },
  {
    id: 'transitions',
    label: 'Transitions',
    file: 'transitions.ts',
    code: `
import { getNextTransition, getTransitions } from 'clockworktz'

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

getTransitions('Pacific/Chatham', '2024-01-01T00:00:00Z', '2025-01-01T00:00:00Z')
  .map(t => [t.date.toISOString(), t.fromOffset, t.toOffset])
// [
//   ['2024-04-06T14:00:00.000Z', 825, 765],
//   ['2024-09-28T14:00:00.000Z', 765, 825]
// ]
`,
  },
  {
    id: 'tzdb',
    label: 'Embedded tzdb',
    file: 'init.ts',
    code: `
import { initClockworkTZ, fromUTC, tzdbVersion, DEFAULT_MANIFEST_URL } from 'clockworktz'
import { tzdb } from 'clockworktz/tzdb'

// Pin an exact IANA release: identical results on every platform,
// and keep it fresh with Ed25519-signed updates
await initClockworkTZ({
  engine: 'embedded-tzdb',
  data: tzdb,
  manifestURL: DEFAULT_MANIFEST_URL,
})

tzdbVersion() // '2026f'

// Exact history the platform's Intl data can't give you
fromUTC('1850-01-01T00:00:00Z', 'Europe/Amsterdam')
// { local: '1850-01-01 00:17:30.000', offsetMinutes: 17.5,
//   abbreviation: 'LMT', source: 'embedded-tzdb', tzdbVersion: '2026f', … }
`,
  },
  {
    id: 'react',
    label: 'React clock',
    file: 'WorldClock.tsx',
    code: `
'use client'
import { useEffect, useState } from 'react'
import { format, onTick, watchZoneTransitions } from 'clockworktz'

export function WorldClock({ zone }: { zone: string }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    // Fires on every whole second of wall-clock time, so it never drifts
    const stopTicking = onTick(setNow, 1000)
    // Re-render the moment the zone changes offset (DST start or end)
    const stopWatching = watchZoneTransitions(zone, at => setNow(at))
    return () => {
      stopTicking()
      stopWatching()
    }
  }, [zone])

  return <time>{format(now, zone, 'HH:mm:ss zzz')}</time>
}
`,
    lang: 'tsx',
  },
] as const
