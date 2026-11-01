# Unusual zones

Timezone code is usually written and tested in a handful of zones that are a whole number of hours from UTC and shift by one hour for DST. These are the zones that break that assumption, and all of them are in clockwork-tz's test suite. Both engines are tested against the same exact fixtures.

## Offsets that aren't whole hours

| Zone                 | Offset                | Notes                                             |
| -------------------- | --------------------- | ------------------------------------------------- |
| `Asia/Kolkata`       | +05:30                | India; also `Asia/Calcutta`                       |
| `Asia/Kathmandu`     | +05:45                | Nepal                                             |
| `Australia/Eucla`    | +08:45                | An unofficial zone on the Nullarbor Plain         |
| `Australia/Adelaide` | +09:30 / +10:30       | Half-hour, with DST                               |
| `Pacific/Chatham`    | +12:45 / +13:45       | 45 minutes past, with DST                         |
| `Pacific/Marquesas`  | −09:30                |                                                   |
| `America/St_Johns`   | −03:30 / −02:30       | Newfoundland                                      |

```ts
import { fromUTC, getOffset } from 'clockwork-tz'

getOffset('2024-01-01T00:00:00Z', 'Australia/Eucla') // 525
fromUTC('2024-07-15T14:00:00Z', 'Pacific/Marquesas').local // '2024-07-15 04:30:00.000'
```

## DST that isn't one hour

| Zone                  | Shift      | Notes                                                       |
| --------------------- | ---------- | ----------------------------------------------------------- |
| `Australia/Lord_Howe` | 30 minutes | +10:30 in winter, +11:00 in summer                          |
| `Antarctica/Troll`    | 2 hours    | +00:00 to +02:00                                            |
| `Europe/Dublin`       | negative   | Irish law defines summer time as standard and winter as the exception |

Lord Howe's gap and overlap are 30 minutes long, and clockwork-tz [disambiguates](./dst-disambiguation.md) them by exactly that much:

```ts
import { interpretLocal } from 'clockwork-tz'

interpretLocal('2024-10-06T02:15:00', 'Australia/Lord_Howe').local
// '2024-10-06 02:45:00.000'
```

## Extremes

- `Pacific/Kiritimati` is UTC+14, the earliest zone on Earth: when it's 14:00 UTC on 15 July, it's already 04:00 on 16 July there.
- `Pacific/Apia` (Samoa) **skipped 30 December 2011** entirely when it moved across the date line from −10 to +14.

```ts
interpretLocal('2011-12-30T12:00:00', 'Pacific/Apia').local
// '2011-12-31 12:00:00.000'
```

## Rules that changed

- **Casablanca** suspends DST during Ramadan, so it has transitions in March and April that go the "wrong" way.
- **Caracas** moved from −04:30 to −04:00 in 2016.
- **Pyongyang** moved from +09:00 to +08:30 in 2015, and back in 2018.
- **Renamed zones** keep working: `Europe/Kiev` canonicalizes to `Europe/Kyiv`, `Asia/Calcutta` to `Asia/Kolkata`.

## Sign inversion in `Etc` zones

POSIX-style `Etc/GMT±N` zones have the opposite sign to what you'd expect: `Etc/GMT+5` is UTC−5.

```ts
import { getOffset } from 'clockwork-tz'

getOffset('2024-01-01T00:00:00Z', 'Etc/GMT+5') // -300
```

## Local mean time

Before standard time zones were adopted (mostly in the late 19th century), towns kept local mean time based on their longitude. The tzdb records these offsets, which often include seconds. With the `embedded-tzdb` engine you get them exactly:

```ts
import { initClockworkTZ, fromUTC } from 'clockwork-tz'
import { tzdb } from 'clockwork-tz/tzdb'

await initClockworkTZ({ engine: 'embedded-tzdb', data: tzdb })

fromUTC('1850-01-01T00:00:00Z', 'Europe/Amsterdam')
// { local: '1850-01-01 00:17:30.000', offsetMinutes: 17.5, abbreviation: 'LMT', … }
```

`offsetMinutes` is fractional only for these historical offsets.

## The far future

The tzdb stores rules, not just a list of dates. clockwork-tz's embedded engine evaluates the POSIX TZ rule at the end of each zone's data, so DST transitions beyond 2100 come out right.

## How it's tested

- Exact fixtures for every zone above, shared by both engines.
- The embedded data is checked against ICU for every zone from 1970 onwards.
- The suite runs under several host timezones (`UTC`, `America/New_York`, `Australia/Lord_Howe`, `Asia/Kathmandu`), because timezone bugs often only appear when the host isn't at UTC+0.
- Browser tests run in Chromium, Firefox and WebKit.
