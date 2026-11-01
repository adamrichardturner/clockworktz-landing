# API reference

Every export of `clockworktz` and `clockworktz/tzdb`, grouped by purpose. Types are TypeScript; everything is available from both ESM and CommonJS.

```ts
type DateInput = string | Date | number // ISO string with offset, Date, or epoch ms
type Disambiguation = 'compatible' | 'earliest' | 'latest' | 'reject'
type EngineKind = 'system-intl' | 'embedded-tzdb'
type LabelStyle = 'original' | 'offset' | 'abbrev' | 'altName'
```

## Conversion

### `fromUTC`

```ts
function fromUTC(input: DateInput, zone: string, opts?: FormatOptions): ClockworkTime
```

An instant as seen in `zone`. Throws `TimezoneError` for an invalid zone or an input that isn't an instant (including strings without an offset). [Guide](./core-concepts.md)

```ts
fromUTC('2024-07-15T14:00:00Z', 'Asia/Kolkata').local // '2024-07-15 19:30:00.000'
```

### `interpretLocal`

```ts
function interpretLocal(wallTime: string | WallTime, zone: string, opts?: ConvertOptions): ClockworkTime

type WallTime = {
  year: number
  month: number // 1–12
  day: number
  hour?: number
  minute?: number
  second?: number
  millisecond?: number
}
```

The instant a wall time names in `zone`. Skipped and repeated times resolve with `opts.disambiguation` (default `compatible`). Throws `TimezoneError` for invalid input, `InvalidTimeError` or `AmbiguousTimeError` with `reject`. [Guide](./dst-disambiguation.md)

```ts
interpretLocal('2024-03-10T02:30:00', 'America/New_York').local // '2024-03-10 03:30:00.000'
```

### `convert`

```ts
function convert(input: DateInput, fromZone: string, toZone: string, opts?: ConvertOptions): ClockworkTime
```

A string without an offset is wall time in `fromZone`; anything else is an instant. Returns the result in `toZone`.

```ts
convert('2024-07-15T16:30:00', 'Asia/Kathmandu', 'America/St_Johns').local // '2024-07-15 08:15:00.000'
```

### `ClockworkTime`

| Field           | Type          | Description                                                  |
| --------------- | ------------- | ------------------------------------------------------------ |
| `utc`           | `string`      | ISO instant with `Z`, e.g. `'2024-07-15T14:00:00.000Z'`      |
| `zone`          | `string`      | The zone you passed                                          |
| `local`         | `string`      | Local time, formatted with `opts.format` or `yyyy-MM-dd HH:mm:ss.SSS` |
| `offsetMinutes` | `number`      | Offset from UTC in minutes; fractional only for local mean time |
| `isDST`         | `boolean`     | Whether DST is in effect                                     |
| `abbreviation`  | `string`      | e.g. `'EDT'`, `'+0545'`                                      |
| `source`        | `EngineKind`  | Engine that produced the result                              |
| `tzdbVersion`   | `string?`     | tzdb release, with `embedded-tzdb` only                      |

### Options

```ts
interface FormatOptions {
  format?: string // pattern for `local`
  locale?: string // month/weekday/day-period names, default 'en'
}

interface ConvertOptions extends FormatOptions {
  disambiguation?: Disambiguation // default 'compatible'
}
```

## Zone information

| Function                                           | Returns                                                         |
| -------------------------------------------------- | --------------------------------------------------------------- |
| `getZoneInfo(input: DateInput, zone: string)`      | `ZoneInfo`: `{ offsetSeconds, isDST, abbreviation }`            |
| `getOffset(input: DateInput, zone: string)`        | `number`: offset in minutes                                     |
| `isDST(input: DateInput, zone: string)`            | `boolean`; `false` for invalid zones                            |
| `isValidTimeZone(zone: string)`                    | `boolean`; accepts IANA names, links and fixed offsets          |
| `canonicalizeTimeZone(zone: string)`               | `string`: `'Asia/Calcutta'` → `'Asia/Kolkata'`                  |
| `getUserTimeZone()`                                | `string`: the runtime's zone, canonicalized, or `'UTC'`         |
| `getZoneCountries(zone: string)`                   | `string[]`: ISO 3166 codes, e.g. `['CH', 'DE', 'LI']`           |
| `listTimeZones(opts?: ListOptions)`                | `TimeZoneItem[]`, sorted by offset then name                    |

```ts
getZoneInfo('2024-07-01T00:00:00Z', 'Asia/Kathmandu')
// { offsetSeconds: 20700, isDST: false, abbreviation: '+0545' }
```

`getZoneInfo`, `getOffset`, `canonicalizeTimeZone` and `getZoneCountries` throw `TimezoneError` for an invalid zone.

```ts
interface ListOptions {
  labelStyle?: LabelStyle // default 'original'
  at?: DateInput // default now
  locale?: string // for 'altName', default 'en'
  country?: string // ISO 3166 code
}

interface TimeZoneItem {
  value: string
  label: string
  offsetMinutes: number
  countryCodes: string[]
}
```

[Guide](./time-zone-lists.md)

## Formatting

| Function                                                              | Description                                     |
| --------------------------------------------------------------------- | ----------------------------------------------- |
| `format(input, zone, pattern = DEFAULT_FORMAT_PATTERN, locale = 'en')` | Format an instant in a zone                    |
| `formatWithPattern(input, zone, name: keyof typeof FORMAT_PATTERNS)`  | Format with a named pattern                     |
| `formatNow(zone, pattern?)`                                           | Format the current time                         |
| `formatFor(input, zone, useCase)`                                     | `'display' \| 'log' \| 'filename' \| 'api' \| 'human'` |
| `formatRange(start, end, zone, { pattern?, separator?, sameDay? })`   | Format a range                                  |
| `formatDuration(start, end, { units?, precision? })`                  | `'2 days, 2 hours'`                             |
| `formatRelative(input, zone, relativeTo = new Date())`                | `'2 hours ago'`, `'in 3 days'`, or a date       |
| `formatOffset(offsetMinutes)`                                         | `345` → `'+05:45'`                              |
| `isValidFormatPattern(pattern)`                                       | `boolean`                                       |
| `FORMAT_PATTERNS`                                                     | Named patterns: `default`, `dateOnly`, `timeOnly`, `dateTime`, `dateTimeMs`, `amPm`, `human`, `short`, `long`, `rfc2822`, `iso8601` |
| `DEFAULT_FORMAT_PATTERN`                                              | `'yyyy-MM-dd HH:mm:ss zzz'`                     |

[Guide and token table](./formatting.md)

## Parsing

| Function                                     | Returns                                                   |
| -------------------------------------------- | --------------------------------------------------------- |
| `parse(input, opts?: ParseOptions)`          | `ParseResult`; throws in strict mode                      |
| `parseDate(input, opts?)`                    | `Date`; throws if invalid                                 |
| `safeParse(input, opts?)`                    | `ParseResult \| null`; never throws, always non-strict    |
| `isParseable(input, opts?)`                  | `boolean`                                                 |
| `parseAny(input, formats?: ParseOptions[])`  | First valid `ParseResult`; throws if none                 |
| `parseRange(input, { separator?, ...ParseOptions })` | `{ start: Date; end: Date }`                      |
| `parseTime(input)`                           | `{ hour, minute, second, millisecond }`                   |
| `parseOffset(input)`                         | Offset in minutes                                         |
| `parseComponents(input)`                     | `DateComponents` (wall-time fields)                       |
| `normalize(input: DateInput)`                | `Date`                                                    |
| `isValidISOString(input)`                    | `boolean`: ISO with an offset                             |
| `isValidLocalISOString(input)`               | `boolean`: ISO without an offset                          |

```ts
interface ParseOptions {
  strict?: boolean // default true
  defaultTimezone?: string // default 'UTC'
}

interface ParseResult {
  date: Date
  hasTimezone: boolean
  original: string
  isValid: boolean
}

interface DateComponents {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
}
```

[Guide](./parsing.md)

## Transitions and clocks

| Function                                                        | Returns                                     |
| --------------------------------------------------------------- | ------------------------------------------- |
| `getNextTransition(zone, from = new Date())`                    | `TransitionInfo \| null`                    |
| `getPreviousTransition(zone, from = new Date())`                | `TransitionInfo \| null`                    |
| `getTransitions(zone, from, to)`                                | `TransitionInfo[]` in `[from, to)`          |
| `isNearTransition(input, zone, engine?, windowHours = 24)`      | `boolean`                                   |
| `watchZoneTransitions(zone, callback: (at: Date) => void)`      | `() => void` stop function                  |
| `onTick(callback: (now: Date) => void, granularityMs = 1000)`   | `() => void` stop function                  |
| `cleanupAllWatchers()`                                          | `void`                                      |
| `getWatcherStats()`                                             | `{ transitionWatchers, tickWatchers }`      |

`getNextTransition` and `getPreviousTransition` search two years by default and also accept `engine` and `searchDays` arguments.

```ts
interface TransitionInfo {
  date: Date
  fromOffset: number // minutes
  toOffset: number // minutes
  isDSTStart: boolean
  isDSTEnd: boolean
  fromAbbreviation: string
  toAbbreviation: string
}
```

[Guide](./transitions.md)

## Lifecycle

| Function                              | Description                                                         |
| ------------------------------------- | ------------------------------------------------------------------- |
| `initClockworkTZ(opts?: ClockworkOptions)` | Choose and configure the engine; returns `Promise<void>`       |
| `dispose()`                           | Stop auto-updates and cross-tab listening                           |
| `engine()`                            | Current `EngineKind`                                                |
| `tzdbVersion()`                       | tzdb version, or `undefined` with `system-intl`                     |
| `getStatus()`                         | `{ engine, tzdbVersion?, dataLoaded, lastUpdate? }`                 |
| `getInitOptions()`                    | A copy of the last `ClockworkOptions`                               |
| `onDataUpdate(callback: (version: string) => void)` | Unsubscribe function                                  |
| `refreshTimezoneData()`               | `Promise<boolean>`: true if newer data was loaded                   |
| `VERSION`                             | The library version, e.g. `'1.0.0'`                                 |

```ts
interface ClockworkOptions {
  engine?: EngineKind // default 'system-intl'
  data?: unknown // tzdb data for 'embedded-tzdb'
  manifestURL?: string // signed manifest to load and keep fresh
  publicKey?: string // base64 raw Ed25519 key, default DEFAULT_PUBLIC_KEY
  autoUpdateIntervalMs?: number // default 24h, 0 disables
}
```

[Guide](./engines.md)

## Data updates

| Export                                              | Description                                                    |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `DEFAULT_MANIFEST_URL`                              | `'https://cdn.jsdelivr.net/npm/clockworktz-data@1/manifest.json'` |
| `DEFAULT_PUBLIC_KEY`                                | `'DLvL/miUAfXKI8Sae27IuV/o5l3vbg5OIp5QMkeXLkU='`               |
| `ensureFreshTzdb(manifestURL?, { publicKey?, fetch? })` | `Promise<{ version, data } \| null>`: fetch, verify and cache without changing the engine |
| `verifyManifestSignature(manifest, publicKey?)`     | `Promise<boolean>`; fails closed without WebCrypto Ed25519     |
| `compareTzdbVersions(a, b)`                         | Negative, zero or positive, e.g. `('2026a', '2025z')` → `1`    |
| `clearCache(manifestURL?, publicKey?)`              | Clear cached data for one manifest, or all                     |
| `getCacheStats(manifestURL?, publicKey?)`           | `{ dataCached, dataVersion?, dataAge? }`                       |

```ts
interface TzdbManifest {
  version: string // e.g. '2026f'
  releaseDate: string
  dataUrl: string // absolute, or relative to the manifest URL
  sha256: string // hex SHA-256 of the data file
  signature: string // base64 Ed25519 over `${version}\n${sha256}`
  keyId: string
}
```

[Security & signing](./security.md)

## Engines

| Export                               | Description                                          |
| ------------------------------------ | ---------------------------------------------------- |
| `getCurrentEngine()`                 | The active `TzEngine`                                |
| `setEngine(engine: TzEngine)`        | Install an engine directly (tests, advanced use)     |
| `createSystemIntlEngine()`           | A new `SystemIntlEngine`                             |
| `createEmbeddedTzdbEngine(data?)`    | A new `EmbeddedTzdbEngine`                           |
| `SystemIntlEngine`, `EmbeddedTzdbEngine` | The engine classes                               |

```ts
interface TzEngine {
  readonly kind: EngineKind
  getVersion(): string | undefined
  isValidTimeZone(zone: string): boolean
  canonicalize(zone: string): string
  listZoneIds(): string[]
  getZoneInfo(epochMs: number, zone: string): ZoneInfo
  getTransitions?(zone: string, fromMs: number, toMs: number): Transition[]
  getCountryCodes?(zone: string): string[]
}

interface LoadableEngine extends TzEngine {
  loadTzdbData(data: unknown): void
  isDataLoaded(): boolean
}

interface ZoneInfo {
  offsetSeconds: number
  isDST: boolean
  abbreviation: string
}

interface Transition {
  at: number // epoch ms
  before: ZoneInfo
  after: ZoneInfo
}
```

## Errors

| Class                | Extends         | Thrown for                                    |
| -------------------- | --------------- | --------------------------------------------- |
| `TimezoneError`      | `Error`         | Everything: invalid zones, input, patterns, options and data |
| `InvalidTimeError`   | `TimezoneError` | Skipped time with `disambiguation: 'reject'`  |
| `AmbiguousTimeError` | `TimezoneError` | Repeated time with `disambiguation: 'reject'` |

[Guide](./errors.md)

## `clockworktz/tzdb`

```ts
import { tzdb } from 'clockworktz/tzdb'
```

The compiled IANA tzdb snapshot (release `2026f` in 1.0.0), for `initClockworkTZ({ engine: 'embedded-tzdb', data: tzdb })`. About 30 kB gzipped.
