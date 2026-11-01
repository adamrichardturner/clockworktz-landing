import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ClocksDemo } from '@/components/demo/clocks-demo'
import { ConvertDemo } from '@/components/demo/convert-demo'
import { DemoNav } from '@/components/demo/demo-nav'
import { DstLab } from '@/components/demo/dst-lab'
import { EngineProvider } from '@/components/demo/engine-context'
import { EnginesDemo } from '@/components/demo/engines-demo'
import { ErrorsDemo } from '@/components/demo/errors-demo'
import { FormatDemo } from '@/components/demo/format-demo'
import { ParseDemo } from '@/components/demo/parse-demo'
import { TransitionsDemo } from '@/components/demo/transitions-demo'
import { ZonesDemo } from '@/components/demo/zones-demo'
import { pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site'

const description =
  'Try clockworktz live in your browser: world clocks, conversions, DST gaps and overlaps, transitions, formatting, parsing, zone lists, engines and signed tzdb updates.'

export const metadata: Metadata = {
  title: 'Live demo',
  ...pageMetadata({ title: 'clockworktz live demo', description, path: '/demo' }),
}

const sections = [
  {
    id: 'clocks',
    label: 'Clocks',
    title: 'Live clocks that never drift',
    apis: ['onTick', 'format', 'getZoneInfo'],
    body: 'onTick fires on every whole second of wall-clock time, so clocks stay in step instead of drifting like setInterval. Each face is positioned from the zone’s real offset, including half- and quarter-hour ones.',
    docs: '/docs/transitions#ticking-clocks',
    Demo: ClocksDemo,
  },
  {
    id: 'convert',
    label: 'Convert',
    title: 'Convert wall time between zones',
    apis: ['convert', 'interpretLocal'],
    body: 'Pick a wall time in one zone and see it everywhere else. A string without an offset is read in the source zone, never in your machine’s zone.',
    docs: '/docs/core-concepts',
    Demo: ConvertDemo,
  },
  {
    id: 'dst',
    label: 'DST lab',
    title: 'Some local times never happen. Some happen twice.',
    apis: ['interpretLocal', 'getTransitions', 'fromUTC'],
    body: 'The chart plots wall-clock time against UTC around a real transition: a jump up is a gap, a jump down is an overlap. The dots show where each disambiguation strategy lands, exactly as Temporal resolves them.',
    docs: '/docs/dst-disambiguation',
    Demo: DstLab,
  },
  {
    id: 'transitions',
    label: 'Transitions',
    title: 'Every offset change, to the second',
    apis: ['getTransitions', 'getNextTransition', 'watchZoneTransitions'],
    body: 'Chart a zone’s offset through a year, count down to its next change, and watch for it live. Try Samoa in 2011, Pyongyang in 2015 and 2018, Caracas in 2016, or rules in 2100.',
    docs: '/docs/transitions',
    Demo: TransitionsDemo,
  },
  {
    id: 'format',
    label: 'Format',
    title: 'Format in any zone and locale',
    apis: ['format', 'FORMAT_PATTERNS', 'formatRelative', 'formatRange', 'formatDuration'],
    body: 'A date-fns compatible subset of tokens, with offsets, abbreviations and long zone names. Unsupported tokens throw instead of printing something wrong.',
    docs: '/docs/formatting',
    Demo: FormatDemo,
  },
  {
    id: 'parse',
    label: 'Parse',
    title: 'Strict parsing, never in the host’s zone',
    apis: ['parse', 'safeParse', 'parseOffset'],
    body: 'ISO 8601 with an offset is an instant. Without one, it’s wall time in the defaultTimezone you choose. Invalid dates such as 30 February are rejected, not rolled over.',
    docs: '/docs/parsing',
    Demo: ParseDemo,
  },
  {
    id: 'zones',
    label: 'Zones',
    title: 'Every zone, by offset and country',
    apis: ['listTimeZones', 'getZoneCountries'],
    body: 'The building blocks for a timezone picker. Labels describe the zone at the date you pass, so January and July differ. Choose a bar to list its zones.',
    docs: '/docs/time-zone-lists',
    Demo: ZonesDemo,
  },
  {
    id: 'engines',
    label: 'Engines',
    title: 'Two engines, and signed data updates',
    apis: ['initClockworkTZ', 'verifyManifestSignature', 'ensureFreshTzdb'],
    body: 'Switch every demo on this page between the platform’s Intl data and the pinned IANA tzdb. Then run a real signed update from jsDelivr, or tamper with the manifest and watch it get rejected.',
    docs: '/docs/engines',
    Demo: EnginesDemo,
  },
  {
    id: 'errors',
    label: 'Errors',
    title: 'One error class to catch',
    apis: ['TimezoneError', 'InvalidTimeError', 'AmbiguousTimeError'],
    body: 'Invalid zones, input, patterns and options all throw a TimezoneError. With disambiguation set to reject, skipped and repeated times throw its two subclasses.',
    docs: '/docs/errors',
    Demo: ErrorsDemo,
  },
]

export default function DemoPage() {
  return (
    <EngineProvider>
      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-12 sm:px-6">
          <p className="font-mono text-xs font-medium tracking-wider text-accent uppercase">Live demo</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            clockworktz, running in <em className="font-serif font-normal text-accent">your</em> browser.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-fg-muted text-pretty">
            Every output on this page is computed live by clockworktz {site.version} from npm. Change the inputs, read the code, and copy it straight into
            your app.
          </p>
        </div>
      </section>
      <DemoNav sections={sections.map(({ id, label }) => ({ id, label }))} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {sections.map(({ id, title, apis, body, docs, Demo }, i) => (
          <section key={id} id={id} className="scroll-mt-28 border-b border-border py-16 last:border-b-0" aria-labelledby={`${id}-title`}>
            <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-end">
              <div>
                <p className="font-mono text-xs text-fg-faint">{String(i + 1).padStart(2, '0')}</p>
                <h2 id={`${id}-title`} className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                  {title}
                </h2>
                <p className="mt-2 max-w-2xl text-fg-muted text-pretty">{body}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                {apis.map(api => (
                  <code key={api} className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs">
                    {api}
                  </code>
                ))}
                <Link href={docs} className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                  Docs <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
            <Demo />
          </section>
        ))}
      </div>
    </EngineProvider>
  )
}
