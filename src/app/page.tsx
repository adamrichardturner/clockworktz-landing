import Link from 'next/link'
import { ArrowRight, BadgeCheck, Cpu, Database, Globe2, ShieldCheck, Split, Timer } from 'lucide-react'
import { CodeBlock } from '@/components/code-block'
import { InstallCommand } from '@/components/install-command'
import { CodeTabs } from '@/components/landing/code-tabs'
import { DstExplorer } from '@/components/landing/dst-explorer'
import { ZoneClocks } from '@/components/landing/zone-clocks'
import { GitHubIcon } from '@/components/icons'
import { exampleTabs, heroExample } from '@/lib/examples'
import { highlight } from '@/lib/highlight'
import { author, jsonLd, keywords } from '@/lib/seo'
import { homeDescription, site } from '@/lib/site'

const features = [
  {
    Icon: Split,
    title: 'Temporal-exact disambiguation',
    body: 'Skipped and repeated local times resolve with compatible, earliest, latest or reject, exactly as Temporal does.',
    href: '/docs/dst-disambiguation',
  },
  {
    Icon: Globe2,
    title: 'Host independent',
    body: "Results never depend on the timezone of the machine running the code. Strings without an offset are never read in the host's zone.",
    href: '/docs/core-concepts#host-independence',
  },
  {
    Icon: Cpu,
    title: 'Zero dependencies',
    body: "The core is built on the platform's Intl API: about 21 kB gzipped (11 kB minified if you only import fromUTC), ESM and CommonJS, with complete TypeScript types.",
    href: '/docs/getting-started',
  },
  {
    Icon: Database,
    title: 'Deterministic tzdb engine',
    body: 'Opt in to a pinned IANA release (30 kB gzipped) for identical results everywhere, with exact DST flags and local mean time.',
    href: '/docs/engines#embedded-tzdb',
  },
  {
    Icon: ShieldCheck,
    title: 'Signed data updates',
    body: 'Pick up new tzdb releases without redeploying. Updates load only when an Ed25519 signature and SHA-256 hash verify.',
    href: '/docs/engines#signed-updates',
  },
  {
    Icon: Timer,
    title: 'Exact transitions & clocks',
    body: 'Find DST transitions to the second, watch for them past the 24.8-day timer limit, and tick clocks on wall-clock boundaries.',
    href: '/docs/transitions',
  },
]

const weirdZones = [
  'Lord Howe +10:30 / +11',
  'Chatham +12:45 / +13:45',
  'Eucla +08:45',
  'Kathmandu +05:45',
  'Marquesas −09:30',
  'Kiritimati +14',
  "Samoa's skipped day, 2011",
  "Casablanca's Ramadan DST",
  "Dublin's negative DST",
  "Troll's two-hour DST",
  'Caracas 2016',
  'Pyongyang 2015 & 2018',
  'Etc/GMT+5 sign inversion',
  'Europe/Kiev → Europe/Kyiv',
  'Local mean time before 1900',
  'Rules beyond 2100',
]

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs font-medium tracking-wider text-accent uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-fg-muted text-pretty">{children}</p>}
    </div>
  )
}

export default async function Home() {
  const tabs = await Promise.all(
    exampleTabs.map(async tab => ({
      id: tab.id,
      label: tab.label,
      file: tab.file,
      code: tab.code.trim(),
      html: await highlight(tab.code, 'lang' in tab ? tab.lang : 'ts'),
    }))
  )

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${site.url}/#website`,
        name: 'clockworktz',
        alternateName: ['clockwork-tz', 'clockwork tz'],
        url: site.url,
        description: homeDescription,
        inLanguage: 'en',
        publisher: author,
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${site.url}/#software`,
        name: 'clockworktz',
        description: site.description,
        url: site.url,
        image: `${site.url}/opengraph-image`,
        codeRepository: site.repo,
        programmingLanguage: ['TypeScript', 'JavaScript'],
        runtimePlatform: ['Node.js', 'Web browsers'],
        license: 'https://opensource.org/licenses/MIT',
        version: site.version,
        keywords: keywords.join(', '),
        author,
        sameAs: [site.repo, site.npm],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:pt-24">
          <div className="min-w-0">
            <a
              href={`${site.repo}/blob/main/CHANGELOG.md`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-muted hover:border-border-strong"
            >
              <span className="size-1.5 rounded-full bg-accent" />v{site.version} · zero dependencies · tzdb{' '}
              {site.tzdbVersion}
            </a>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
              <span className="mb-3 block font-mono text-base font-medium tracking-normal text-fg-muted sm:text-lg">
                clockworktz
              </span>
              Timezones that get the <em className="font-serif font-normal text-accent">weird zones</em> right.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-fg-muted text-pretty">
              A zero-dependency timezone library for JavaScript and TypeScript. Half-hour and 45-minute offsets,
              30-minute DST, skipped days, negative DST and historical local mean time, with DST gaps and overlaps
              resolved exactly the way Temporal does. In about 21 kB.
            </p>
            <div className="mt-8 flex flex-col gap-4">
              <InstallCommand />
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/docs/getting-started"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
                >
                  Get started <ArrowRight className="size-4" />
                </Link>
                <a
                  href={site.repo}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:border-border-strong"
                >
                  <GitHubIcon className="size-4" /> Star on GitHub
                </a>
              </div>
            </div>
          </div>
          <CodeBlock code={heroExample} title="quick-start.ts" className="shadow-xl shadow-black/5 dark:shadow-black/40" />
        </div>
      </section>

      {/* Live clocks */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="Right now" title="Eight zones that break naive timezone code">
          Not every zone is a whole number of hours from UTC, and not every DST shift is one hour. These clocks are
          live in your browser.
        </SectionHeading>
        <div className="mt-10">
          <ZoneClocks />
        </div>
      </section>

      {/* DST explorer */}
      <section className="border-y border-border bg-bg-subtle">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHeading eyebrow="DST gaps and overlaps" title="Some local times never happen. Some happen twice.">
            When clocks spring forward, a wall time is skipped; when they fall back, it repeats. Pick a scenario
            and a strategy to see how <code className="font-mono text-sm text-fg">interpretLocal</code> resolves it.
          </SectionHeading>
          <div className="mt-10">
            <DstExplorer />
          </div>
          <Link
            href="/docs/dst-disambiguation"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            Read the disambiguation guide <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="Why clockworktz" title="Small, strict and exact" />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ Icon, title, body, href }) => (
            <li key={title}>
              <Link
                href={href}
                className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-border-strong"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-fg-muted text-pretty">{body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Examples */}
      <section className="border-y border-border bg-bg-subtle">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div>
            <SectionHeading eyebrow="Examples" title="One small API for every timezone job">
              Convert instants and wall times, format with date-fns-style tokens, find transitions, and drive live
              clocks. Every output shown is the library&apos;s real result.
            </SectionHeading>
            <Link
              href="/docs/api"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              Full API reference <ArrowRight className="size-4" />
            </Link>
          </div>
          <CodeTabs tabs={tabs} />
        </div>
      </section>

      {/* Engines */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="Engines" title="Use the platform's data, or pin your own">
          Both engines run the same conversions and are tested against the same fixtures. Switch with one call.
        </SectionHeading>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {[
            {
              name: 'system-intl',
              tag: 'Default',
              body: "Uses the timezone data built into Node.js or the browser (ICU). Nothing to ship; updates arrive with the OS and runtime.",
              points: ['0 kB of data', 'Always as fresh as the runtime', 'isDST derived from January and July offsets'],
            },
            {
              name: 'embedded-tzdb',
              tag: 'Opt-in · 30 kB gz',
              body: 'Uses a compiled IANA tzdb release from the clockworktz/tzdb subpath. You only pay for it if you import it.',
              points: [
                'Identical results on every platform',
                'Exact DST flags, abbreviations and local mean time',
                'Ed25519-signed updates, shared across tabs',
              ],
            },
          ].map(engine => (
            <div key={engine.name} className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-mono text-lg font-semibold">{engine.name}</h3>
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                  {engine.tag}
                </span>
              </div>
              <p className="mt-3 text-sm text-fg-muted">{engine.body}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {engine.points.map(point => (
                  <li key={point} className="flex gap-2">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-accent" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Tested zones */}
      <section className="border-t border-border bg-bg-subtle">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHeading eyebrow="Tested" title="If it's strange, it's in the test suite">
            Both engines are tested against the same exact fixtures. The embedded data is checked against ICU for
            every zone from 1970 onwards, and the suite runs under several host timezones and in Chromium, Firefox
            and WebKit.
          </SectionHeading>
          <ul className="mt-8 flex flex-wrap gap-2">
            {weirdZones.map(zone => (
              <li key={zone} className="rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-xs text-fg-muted">
                {zone}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Stop debugging <span className="font-serif font-normal text-accent italic">02:30 on a Sunday</span>.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:opacity-90"
          >
            Read the docs <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs/recipes"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:border-border-strong"
          >
            Browse recipes
          </Link>
        </div>
      </section>
    </>
  )
}
