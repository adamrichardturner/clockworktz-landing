# clockworktz documentation

clockworktz converts, formats and parses dates across time zones, and it gets the weird zones right: half-hour and 45-minute offsets, 30-minute DST, skipped days, negative DST and historical local mean time. Local times that fall inside a DST gap or overlap resolve exactly the way [Temporal](https://tc39.es/proposal-temporal/docs/) resolves them.

These docs are plain GitHub-flavoured Markdown. You can read them on [clockworktz.dev/docs](https://clockworktz.dev/docs) or [on GitHub](https://github.com/adamrichardturner/clockworktz-landing/tree/main/content/docs); the content is the same in both places.

```ts
import { fromUTC, interpretLocal } from 'clockworktz'

fromUTC('2024-07-15T14:00:00Z', 'Australia/Lord_Howe').local
// '2024-07-16 00:30:00.000'

// 02:30 doesn't exist in New York on 10 March 2024: it resolves to 03:30 EDT
interpretLocal('2024-03-10T02:30:00', 'America/New_York').local
// '2024-03-10 03:30:00.000'
```

## At a glance

- **Zero runtime dependencies.** The core uses the platform's `Intl` API (about 21 kB gzipped, about 11 kB minified when you import only `fromUTC`).
- **Host independent.** Results never depend on the timezone of the machine running the code.
- **Two engines.** `system-intl` uses the OS or browser timezone data. `embedded-tzdb` uses a pinned IANA tzdb release (30 kB gzipped) for identical results everywhere, with optional signed updates.
- **ESM and CommonJS**, with complete TypeScript types.
- **Node.js 20 or later**, or any browser with `Intl.DateTimeFormat` time zone support.

## Where to start

| If you want to…                                    | Read                                                  |
| -------------------------------------------------- | ----------------------------------------------------- |
| Install it and convert your first time             | [Installation & quick start](./getting-started.md)    |
| Understand instants, wall time and `ClockworkTime` | [Core concepts](./core-concepts.md)                   |
| Handle times that are skipped or repeated by DST   | [DST gaps & overlaps](./dst-disambiguation.md)        |
| Choose between Intl and a pinned tzdb release      | [Engines & tzdb data](./engines.md)                   |
| Display dates with patterns like `yyyy-MM-dd`      | [Formatting](./formatting.md)                         |
| Turn user input into dates safely                  | [Parsing](./parsing.md)                               |
| Find the next DST change, or build a live clock    | [Transitions & clocks](./transitions.md)              |
| Build a timezone picker                            | [Zone lists & countries](./time-zone-lists.md)        |
| Handle failures                                    | [Errors](./errors.md)                                 |
| Copy a working pattern for a real app              | [Recipes](./recipes.md)                               |
| Look up a function's exact signature               | [API reference](./api.md)                             |
| See which edge cases are covered                   | [Unusual zones](./unusual-zones.md)                   |
| Audit how data updates are verified                | [Security & signing](./security.md)                   |

## Links

- [Source on GitHub](https://github.com/adamrichardturner/clockworktz)
- [Package on npm](https://www.npmjs.com/package/clockworktz)
- [Changelog](https://github.com/adamrichardturner/clockworktz/blob/main/CHANGELOG.md)
- [Report an issue](https://github.com/adamrichardturner/clockworktz/issues)
