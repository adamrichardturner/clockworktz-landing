# Engines & tzdb data

Every timezone calculation in clockworktz goes through an **engine**, which answers one question: what offset, DST flag and abbreviation is in effect in this zone at this instant? Everything else (wall-time interpretation, formatting, transitions) is built on that.

There are two engines. They expose the same API and are tested against the same fixtures.

|                         | `system-intl` (default)                    | `embedded-tzdb`                                        |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------ |
| Data source             | The runtime's ICU data via `Intl`          | A compiled IANA tzdb release                           |
| Extra bundle size       | none                                       | ~30 kB gzipped (`clockworktz/tzdb`)                    |
| Same results everywhere | No: depends on the runtime's tzdb version  | Yes                                                    |
| `isDST`                 | Derived from January and July offsets      | Exact, from the tzdb                                   |
| Abbreviations           | What `Intl` reports, for example `+01`     | The tzdb's, for example `BST`                          |
| Local mean time (pre-1900) | Depends on the runtime                  | Exact, for example `+00:17:30` (Amsterdam, 1850)       |
| Transitions             | Found by sampling and bisection, exact to the second | Read directly from the data                  |
| Country data            | `Intl.Locale#getTimeZones` where supported | IANA `zone1970.tab`                                    |
| Updates                 | With the OS, browser or Node.js            | New package release, or signed runtime updates         |

## `system-intl`

The default. It uses the timezone data built into Node.js or the browser, so there's no data to ship and updates arrive with the OS and runtime. Nothing needs initializing.

The trade-off is that different platforms can be on different tzdb releases. When a government changes its DST rules at short notice, an old browser or an unpatched server keeps using the old rules.

`Intl` also doesn't expose whether DST is in effect, so this engine derives `isDST` by comparing a zone's January and July offsets. That's right for almost every modern zone, but it can be wrong for years in which a zone changed its standard offset. In 2016 Venezuela moved from `-04:30` to `-04:00` permanently:

```ts
import { getZoneInfo } from 'clockworktz'

getZoneInfo('2016-05-01T12:00:00Z', 'America/Caracas')
// system-intl:   { offsetSeconds: -14400, isDST: true,  abbreviation: '-04' }
// embedded-tzdb: { offsetSeconds: -14400, isDST: false, abbreviation: '-04' }
```

## `embedded-tzdb`

Uses a compiled IANA tzdb release for deterministic results on every platform, including exact DST flags and abbreviations, local mean time before standardization, and every transition. A snapshot ships in the `clockworktz/tzdb` subpath, so you only pay for it if you import it.

```ts
import { initClockworkTZ, tzdbVersion, fromUTC } from 'clockworktz'
import { tzdb } from 'clockworktz/tzdb'

await initClockworkTZ({ engine: 'embedded-tzdb', data: tzdb })

tzdbVersion() // '2026f'

fromUTC('2024-07-15T14:00:00Z', 'Australia/Lord_Howe')
// { …, abbreviation: '+1030', source: 'embedded-tzdb', tzdbVersion: '2026f' }
```

Call `initClockworkTZ` once, at startup, before anything else uses the library. Calling it again replaces the engine.

### When to use it

- Servers and clients must agree exactly, for example when a server validates a booking a browser created.
- You need correct historical data: exact `isDST`, abbreviations like `BST` and `IST`, or local mean time before 1900.
- You need country data on every browser (some don't support `Intl.Locale#getTimeZones`).
- You want to pick up urgent tzdb changes without waiting for users to update their OS.

### Comparing results

```ts
import { format, getZoneCountries } from 'clockworktz'

format('2024-07-05T09:05:07Z', 'Europe/London', 'zzz zzzz')
// system-intl:   '+01 British Summer Time'
// embedded-tzdb: 'BST British Summer Time'

getZoneCountries('Europe/Zurich')
// system-intl:   ['CH']
// embedded-tzdb: ['CH', 'DE', 'LI']
```

## Signed updates

IANA publishes several tzdb releases a year, sometimes at short notice. To pick them up without releasing your app again, point the engine at the signed manifest:

```ts
import { initClockworkTZ, onDataUpdate, DEFAULT_MANIFEST_URL } from 'clockworktz'
import { tzdb } from 'clockworktz/tzdb'

await initClockworkTZ({
  engine: 'embedded-tzdb',
  data: tzdb, // used immediately and whenever an update can't be verified
  manifestURL: DEFAULT_MANIFEST_URL, // jsDelivr, from the @adamrichardturner/clockworktz-data package
  autoUpdateIntervalMs: 24 * 60 * 60 * 1000, // 0 disables periodic checks
})

onDataUpdate(version => {
  console.log(`Timezone data updated to ${version}`)
})
```

`DEFAULT_MANIFEST_URL` is `https://cdn.jsdelivr.net/npm/@adamrichardturner/clockworktz-data@1/manifest.json`. The `@adamrichardturner/clockworktz-data` package is rebuilt and signed by a scheduled workflow whenever IANA publishes a release.

An update is only applied when **all** of these hold:

- The manifest's Ed25519 signature verifies against the public key built into the library.
- The data's SHA-256 matches the signed hash.
- The version is newer than the data already loaded (no downgrades).

Anything else keeps the current data. `initClockworkTZ` never rejects because of a failed update; it logs a warning and carries on.

### Without bundled data

You can leave out `data` and load everything from the manifest, which keeps the tzdb snapshot out of your bundle entirely. Until the first download has been verified there's no data at all, so `await` the promise before converting:

```ts
import { initClockworkTZ, fromUTC, DEFAULT_MANIFEST_URL } from 'clockworktz'

await initClockworkTZ({ engine: 'embedded-tzdb', manifestURL: DEFAULT_MANIFEST_URL })

fromUTC('2024-07-15T14:00:00Z', 'Asia/Kathmandu').local // '2024-07-15 19:45:00.000'
```

> [!WARNING]
> Without bundled `data`, a failed or offline first load leaves the engine empty, and every zone is reported as invalid (`TimezoneError: Invalid timezone: Asia/Kathmandu`). `getStatus().dataLoaded` tells you whether it worked. Pass `data: tzdb` as well if the app must work offline.

### Caching and tabs

- Verified data is cached per manifest and key, in `localStorage` in browsers and in memory in Node.js (which never touches Node's experimental `localStorage`, so no warning is printed). A cached copy younger than 24 hours is used without a network request.
- Other tabs using the same manifest pick up new data through `BroadcastChannel` and load it too, so one tab's download serves them all.
- `onDataUpdate(version => …)` fires whenever new data is loaded, whether this tab fetched it or another one did. It returns an unsubscribe function.

### Manual refresh and status

```ts
import { refreshTimezoneData, getStatus, dispose } from 'clockworktz'

await refreshTimezoneData() // true if newer data was loaded

getStatus()
// { engine: 'embedded-tzdb', tzdbVersion: '2026f', dataLoaded: true, lastUpdate: Date }

dispose() // stop the update timer and cross-tab listener (e.g. on server shutdown)
```

`refreshTimezoneData` throws `TimezoneError` if the engine isn't `embedded-tzdb` or no `manifestURL` was configured.

### Self-hosting the data

Host your own `manifest.json` and `tzdb.json` (for example on your CDN or behind a firewall), sign the manifest with your own Ed25519 key, and pass the public key:

```ts
await initClockworkTZ({
  engine: 'embedded-tzdb',
  data: tzdb,
  manifestURL: 'https://cdn.example.com/tzdb/manifest.json',
  publicKey: 'BASE64_RAW_ED25519_PUBLIC_KEY',
})
```

See [Security & signing](./security.md) for the manifest format and what's signed.

## `initClockworkTZ` options

| Option                 | Type                                 | Default          | Description                                                        |
| ---------------------- | ------------------------------------ | ---------------- | ------------------------------------------------------------------ |
| `engine`               | `'system-intl' \| 'embedded-tzdb'`   | `'system-intl'`  | Engine to use                                                      |
| `data`                 | `unknown`                            |                  | tzdb data for `embedded-tzdb`, usually `tzdb` from `clockworktz/tzdb` |
| `manifestURL`          | `string`                             |                  | Signed manifest to load and keep fresh                             |
| `publicKey`            | `string`                             | project key      | Base64 raw Ed25519 public key used to verify manifests             |
| `autoUpdateIntervalMs` | `number`                             | `86400000` (24h) | How often to check the manifest; `0` disables periodic checks      |

`initClockworkTZ` throws `TimezoneError` synchronously for invalid options, and leaves the current engine in place when it does:

- an unknown `engine`
- `data` or `manifestURL` without `engine: 'embedded-tzdb'`
- a negative or non-finite `autoUpdateIntervalMs`
- `data` that isn't valid tzdb data

Otherwise it returns a promise that settles once any manifest load has been attempted. You only need to `await` it if you want the freshest data before your first conversion; the bundled `data` is usable immediately.

## Advanced: custom engines

`getCurrentEngine()` returns the active engine and `setEngine(engine)` installs any object that implements the `TzEngine` interface. This is intended for tests and unusual hosts; most apps should use `initClockworkTZ`. The factories `createSystemIntlEngine()` and `createEmbeddedTzdbEngine(data)` are exported too. See the [API reference](./api.md#engines).
