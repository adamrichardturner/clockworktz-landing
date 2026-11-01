export const site = {
  name: 'clockworktz',
  url: 'https://clockworktz.dev',
  description:
    'Timezone conversions that get the weird zones right: exact DST disambiguation, half- and quarter-hour offsets, and an optional deterministic IANA tzdb engine. Zero dependencies.',
  version: '1.0.0',
  tzdbVersion: '2026f',
  repo: 'https://github.com/adamrichardturner/clockworktz',
  docsRepo: 'https://github.com/adamrichardturner/clockworktz-landing',
  npm: 'https://www.npmjs.com/package/clockworktz',
  author: 'Adam Turner',
} as const

/** Under 60 characters, leading with the package name */
export const homeTitle = 'clockworktz: JavaScript & TypeScript timezone library'

/** Under 160 characters, for search snippets and link previews */
export const homeDescription =
  'clockworktz converts and formats dates across time zones with exact DST handling, ' +
  'half-hour offsets and an optional pinned IANA tzdb. Zero dependencies.'
