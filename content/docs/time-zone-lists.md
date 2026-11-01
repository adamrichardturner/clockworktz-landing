# Zone lists & countries

`listTimeZones` returns every zone the engine knows, with a label and the offset in effect at a given instant, sorted by offset and then by name. It's the building block for timezone pickers.

```ts
import { listTimeZones } from 'clockworktz'

listTimeZones({ country: 'AU', labelStyle: 'offset', at: '2024-07-01T00:00:00Z' }).map(z => z.label)
// [
//   '(UTC+08:00) Australia/Perth',
//   '(UTC+08:45) Australia/Eucla',
//   '(UTC+09:30) Australia/Adelaide',
//   …,
//   '(UTC+10:30) Australia/Lord_Howe'
// ]
```

## Options

| Option       | Type                                              | Default      | Description                                         |
| ------------ | ------------------------------------------------- | ------------ | --------------------------------------------------- |
| `labelStyle` | `'original' \| 'offset' \| 'abbrev' \| 'altName'` | `'original'` | How to build `label`                                |
| `at`         | `Date \| number \| string`                        | now          | Instant used for offsets, abbreviations and labels  |
| `locale`     | `string`                                          | `'en'`       | Locale for `altName` labels                         |
| `country`    | `string`                                          |              | Only zones used in this ISO 3166 country, e.g. `AU` (case-insensitive) |

## Items

```ts
interface TimeZoneItem {
  value: string // IANA identifier
  label: string // human-readable label
  offsetMinutes: number // offset at `at`, in minutes
  countryCodes: string[] // ISO 3166 codes of countries using the zone (empty when unknown)
}
```

## Label styles

With `at: '2024-07-01T00:00:00Z'`:

| `labelStyle` | `America/New_York` label                   |
| ------------ | ------------------------------------------ |
| `original`   | `America/New_York`                         |
| `offset`     | `(UTC-04:00) America/New_York`             |
| `abbrev`     | `America/New_York (EDT)`                   |
| `altName`    | `America/New_York (Eastern Daylight Time)` |

Labels describe the zone **at `at`**. In January the same zone is `(UTC-05:00)` and `EST`. For a picker, pass the date the user is scheduling for, not just "now", so the offsets they see are the ones that will apply.

## Which zones are listed

The list contains the zones each engine considers user-facing:

- **`system-intl`** lists what the runtime reports through `Intl.supportedValuesOf('timeZone')`, plus `UTC`: about 419 zones on current Node.js. Runtimes without `supportedValuesOf` get a built-in list of common zones.
- **`embedded-tzdb`** lists `UTC` and the zones in the tzdb's `zone1970.tab`, about 313 zones. Links and backward-compatible names aren't listed, but they're still accepted everywhere a zone is.

```ts
listTimeZones({ at: '2024-01-15T00:00:00Z' }).slice(0, 2)
// [
//   { value: 'Pacific/Midway', label: 'Pacific/Midway', offsetMinutes: -660, countryCodes: ['UM'] },
//   { value: 'Pacific/Niue', label: 'Pacific/Niue', offsetMinutes: -660, countryCodes: ['NU'] }
// ]
```

## Countries

`getZoneCountries(zone)` returns the ISO 3166 codes of the countries that use a zone:

```ts
import { getZoneCountries } from 'clockworktz'

getZoneCountries('Europe/Zurich')
// embedded-tzdb: ['CH', 'DE', 'LI']
// system-intl:   ['CH']
```

Country data comes from IANA's `zone1970.tab` with the embedded engine, and from `Intl.Locale#getTimeZones` with the Intl engine where the runtime supports it. Not every browser does; without it, `countryCodes` is empty and the `country` filter matches nothing. If you build a country-based picker for browsers, use the [embedded engine](./engines.md#embedded-tzdb).

`zone1970.tab` lists every country that shares a zone's clock since 1970, so with the embedded engine a zone can appear under more than one country: `getZoneCountries('Asia/Tokyo')` is `['JP', 'AU']`, and `listTimeZones({ country: 'AU' })` includes `Asia/Tokyo` alongside the Australian zones.

Fixed offsets and zones not tied to a country (such as `UTC`) return `[]`.

## Example: a grouped `<select>`

```ts
import { listTimeZones } from 'clockworktz'

function zoneOptions(at: Date) {
  const groups = new Map<string, { value: string; label: string }[]>()
  for (const zone of listTimeZones({ labelStyle: 'offset', at })) {
    const region = zone.value.split('/')[0]!
    if (!groups.has(region)) groups.set(region, [])
    groups.get(region)!.push({ value: zone.value, label: zone.label })
  }
  return groups
}
```

The [recipes page](./recipes.md#a-timezone-picker) has a complete React version.
