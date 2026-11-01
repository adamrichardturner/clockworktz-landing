// Docs navigation, kept free of server-only imports so client components can use it

export interface DocLink {
  slug: string
  title: string
  /** Meta description for search results and link previews, under 160 characters */
  description: string
}

export interface DocGroup {
  title: string
  items: DocLink[]
}

export const docsNav: DocGroup[] = [
  {
    title: 'Getting started',
    items: [
      {
        slug: '',
        title: 'Introduction',
        description:
          'clockwork-tz documentation: a zero-dependency JavaScript and TypeScript timezone library with exact DST handling and an optional pinned IANA tzdb.',
      },
      {
        slug: 'getting-started',
        title: 'Installation & quick start',
        description:
          'Install clockwork-tz with npm, pnpm, yarn or bun, then convert, format and interpret times across time zones in a few lines of TypeScript.',
      },
      {
        slug: 'core-concepts',
        title: 'Core concepts',
        description:
          "Instants versus wall time, the ClockworkTime result, zone identifiers and why clockwork-tz never depends on the host machine's time zone.",
      },
    ],
  },
  {
    title: 'Guides',
    items: [
      {
        slug: 'dst-disambiguation',
        title: 'DST gaps & overlaps',
        description:
          "How clockwork-tz resolves local times skipped or repeated by daylight saving time, using Temporal's compatible, earliest, latest and reject options.",
      },
      {
        slug: 'engines',
        title: 'Engines & tzdb data',
        description:
          "Choose between clockwork-tz's system-intl engine and the embedded IANA tzdb engine, with Ed25519-signed timezone data updates.",
      },
      {
        slug: 'formatting',
        title: 'Formatting',
        description:
          "Format dates in any time zone with clockwork-tz's date-fns compatible tokens, predefined patterns, ranges, durations and relative times.",
      },
      {
        slug: 'parsing',
        title: 'Parsing',
        description:
          'Strict ISO 8601 parsing in clockwork-tz: offsets, wall times read in an explicit zone, safe parsing, ranges, times and offsets.',
      },
      {
        slug: 'transitions',
        title: 'Transitions & clocks',
        description:
          'Find DST transitions to the second, watch for clock changes and build drift-free live clocks with clockwork-tz.',
      },
      {
        slug: 'time-zone-lists',
        title: 'Zone lists & countries',
        description:
          'List IANA time zones with offset, abbreviation or long-name labels, filter by country and build a timezone picker with clockwork-tz.',
      },
      {
        slug: 'errors',
        title: 'Errors',
        description:
          'TimezoneError, InvalidTimeError and AmbiguousTimeError in clockwork-tz: what throws, what each message means and which functions never throw.',
      },
      {
        slug: 'recipes',
        title: 'Recipes',
        description:
          'Working clockwork-tz recipes: meeting schedulers, DST-safe recurring events, a React world clock, a timezone picker and booking validation.',
      },
    ],
  },
  {
    title: 'Reference',
    items: [
      {
        slug: 'api',
        title: 'API reference',
        description:
          'Complete clockwork-tz API reference: every function, type, option and error, for conversion, formatting, parsing, transitions and tzdb updates.',
      },
      {
        slug: 'unusual-zones',
        title: 'Unusual zones',
        description:
          "The time zones that break naive code, from Lord Howe's 30-minute DST to Samoa's skipped day, and how clockwork-tz handles each one.",
      },
      {
        slug: 'security',
        title: 'Security & signing',
        description:
          'How clockwork-tz verifies timezone data updates: Ed25519 signatures, SHA-256 hashes, no downgrades, key handling and self-hosting.',
      },
      {
        slug: 'faq',
        title: 'FAQ',
        description:
          'Answers to common clockwork-tz questions: Date and Intl versus clockwork-tz, Temporal, engines, bundle size, runtimes and DST handling.',
      },
    ],
  },
]

export const docSlugs = docsNav.flatMap(group => group.items.map(item => item.slug))

export function docHref(slug: string): string {
  return slug ? `/docs/${slug}` : '/docs'
}

export function getAdjacentDocs(slug: string): { prev?: DocLink; next?: DocLink } {
  const flat = docsNav.flatMap(group => group.items)
  const index = flat.findIndex(item => item.slug === slug)
  return { prev: flat[index - 1], next: flat[index + 1] }
}
