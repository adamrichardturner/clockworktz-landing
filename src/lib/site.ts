export const site = {
  name: 'clockwork-tz',
  url: 'https://clockworktz.dev',
  description:
    'Timezone conversions that get the weird zones right: exact DST disambiguation, half- and quarter-hour offsets, and an optional deterministic IANA tzdb engine. Zero dependencies.',
  version: '1.0.0',
  tzdbVersion: '2026f',
  repo: 'https://github.com/adamrichardturner/clockwork-tz',
  docsRepo: 'https://github.com/adamrichardturner/clockwork-tz-landing',
  npm: 'https://www.npmjs.com/package/clockwork-tz',
  author: 'Adam Turner',
} as const

/** Under 60 characters, leading with the package name */
export const homeTitle = 'clockwork-tz: JavaScript & TypeScript timezone library'

/** Under 160 characters, for search snippets and link previews */
export const homeDescription =
  'clockwork-tz converts and formats dates across time zones with exact DST handling, ' +
  'half-hour offsets and an optional pinned IANA tzdb. Zero dependencies.'
