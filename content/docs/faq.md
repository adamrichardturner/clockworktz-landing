# FAQ

## Why not just use `Date`?

`Date` is an instant with two views: UTC and the host's local zone. It can't show a time in any other zone, and `new Date('2024-07-15T14:00:00')` reads the string in whatever zone the machine is in. clockworktz works in any zone, never depends on the host, and makes DST gaps and overlaps explicit.

## Why not just use `Intl.DateTimeFormat`?

`Intl` can display an instant in any zone, but it can't go the other way (wall time in a zone to an instant), doesn't tell you whether DST is in effect, doesn't list transitions, and formats with locale conventions rather than exact patterns. clockworktz's default engine is built on `Intl` and fills those gaps.

## How does it relate to Temporal?

[Temporal](https://tc39.es/proposal-temporal/docs/) is the upcoming built-in date-time API. clockworktz resolves skipped and repeated local times with Temporal's exact semantics (`compatible`, `earliest`, `latest`, `reject`), so moving to `Temporal.ZonedDateTime` later won't change your results. Until Temporal is everywhere you need it, clockworktz works today on Node.js 20+ and every modern browser, with no polyfill.

## Which engine should I use?

Start with the default `system-intl`. Switch to `embedded-tzdb` if servers and clients must agree exactly, you need exact `isDST` or historical data, or you need country data on every browser. See [Engines & tzdb data](./engines.md).

## Does it make network requests?

Only if you pass `manifestURL` to `initClockworkTZ`. Otherwise never.

## Does it work in the browser, Deno, Bun, edge runtimes and React Native?

It needs `Intl.DateTimeFormat` with time zone support. Signed updates additionally need `fetch` and WebCrypto Ed25519 (when those aren't available, updates are skipped and the bundled data is kept). Node.js 20+ and the evergreen browsers are tested in CI (Chromium, Firefox and WebKit).

## Is it tree-shakeable?

Yes. The package is `sideEffects: false`, and the tzdb snapshot lives in its own `clockworktz/tzdb` entry, so it's only bundled if you import it.

## Why does `fromUTC` reject `'2024-07-15T14:00:00'`?

That string has no offset, so it isn't an instant; it's a wall time. Rather than guess the zone (the host's, as `Date` does), clockworktz asks you to say which: `interpretLocal('2024-07-15T14:00:00', 'Europe/Paris')`, or add `Z` if you meant UTC.

## Why is the abbreviation `+0545` instead of something like `NPT`?

The IANA tzdb only uses letter abbreviations where they're in real, widespread use. Elsewhere it uses numeric ones. clockworktz reports what the data says rather than inventing names. Use the `zzzz` token for a long name such as `Nepal Time`.

## Why is London's abbreviation `+01` in summer?

That's what some runtimes' `Intl` data reports for the `system-intl` engine. The `embedded-tzdb` engine reports `BST`. See [comparing results](./engines.md#comparing-results).

## How do I handle 02:30 on a spring-forward night?

Decide what it should mean, then pass `disambiguation`. The default, `compatible`, moves it forward to 03:30; `reject` throws so you can ask the user. See [DST gaps & overlaps](./dst-disambiguation.md).

## Can I add or subtract days?

clockworktz converts and formats; it isn't a date-arithmetic library. For "same wall time, N days later", do the calendar arithmetic on the wall-time fields and call `interpretLocal` (see the [recurring event recipe](./recipes.md#a-recurring-event-that-survives-dst)). For "exactly N hours later", add milliseconds to the instant.

## Where do I report a bug?

[Open an issue on GitHub](https://github.com/adamrichardturner/clockworktz/issues). For security problems, email [hello@adamrichardturner.dev](mailto:hello@adamrichardturner.dev) instead.
