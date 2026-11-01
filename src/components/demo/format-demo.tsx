'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  FORMAT_PATTERNS,
  format,
  formatDuration,
  formatRange,
  formatRelative,
  formatWithPattern,
  isValidFormatPattern,
} from 'clockworktz'
import { useEngine, useMounted } from './engine-context'
import { DemoSkeleton, Select, TextInput, ZoneSelect } from './controls'
import { LiveCode } from './live-code'
import { useNow } from './use-now'
import { attempt, lit } from '@/lib/demo/inspect'

const tokens = [
  ['yyyy', 'year'],
  ['MMMM', 'month'],
  ['MMM', 'month'],
  ['MM', 'month'],
  ['d', 'day'],
  ['EEEE', 'weekday'],
  ['EEE', 'weekday'],
  ['HH', 'hour'],
  ['h', 'hour 12h'],
  ['a', 'AM/PM'],
  ['mm', 'minute'],
  ['ss', 'second'],
  ['SSS', 'ms'],
  ['zzz', 'abbrev'],
  ['zzzz', 'zone name'],
  ['xxx', 'offset'],
  ['XXX', 'offset or Z'],
  ['OOOO', 'GMT offset'],
  ["'at'", 'literal'],
] as const

const locales = [
  { value: 'en', label: 'English (en)' },
  { value: 'fr', label: 'Français (fr)' },
  { value: 'de', label: 'Deutsch (de)' },
  { value: 'es', label: 'Español (es)' },
  { value: 'ja', label: '日本語 (ja)' },
  { value: 'hi', label: 'हिन्दी (hi)' },
] as const

export function FormatDemo() {
  const mounted = useMounted()
  const { rev } = useEngine()
  const now = useNow(1000)
  const [pattern, setPattern] = useState("EEEE d MMMM yyyy 'at' HH:mm:ss xxx")
  const [zone, setZone] = useState('Asia/Kathmandu')
  const [locale, setLocale] = useState<(typeof locales)[number]['value']>('en')
  const [hours, setHours] = useState(-26)

  if (!mounted || !now) return <DemoSkeleton height={520} />

  const valid = isValidFormatPattern(pattern)
  const outcome = attempt(() => format(now, zone, pattern, locale))
  const code = `import { format } from 'clockworktz'

format(new Date(), ${lit(zone)}, ${lit(pattern)}${locale === 'en' ? '' : `, ${lit(locale)}`})`

  const target = new Date(now.getTime() + hours * 3_600_000)
  const [start, end] = hours < 0 ? [target, now] : [now, target]
  const helpers = [
    { call: `formatRelative(target, ${lit(zone)})`, value: formatRelative(target, zone, now) },
    { call: `formatRange(start, end, ${lit(zone)})`, value: formatRange(start, end, zone) },
    { call: 'formatDuration(start, end)', value: formatDuration(start, end) },
  ]

  return (
    <div className="flex flex-col gap-6" data-rev={rev}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <TextInput label="Pattern" value={pattern} onChange={setPattern} invalid={!valid} />
          <div className="flex flex-wrap gap-1.5" aria-label="Insert a token">
            {tokens.map(([token, hint]) => (
              <button
                key={token}
                type="button"
                title={hint}
                onClick={() => setPattern(`${pattern}${pattern.endsWith(' ') || !pattern ? '' : ' '}${token}`)}
                className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg"
              >
                {token}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ZoneSelect value={zone} onChange={setZone} />
            <Select label="Locale" value={locale} options={locales} onChange={setLocale} />
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-medium text-fg-muted">Right now, in {zone}</p>
            <p className={`mt-1 font-mono text-xl font-medium break-words sm:text-2xl ${outcome.ok ? '' : 'text-danger'}`}>
              {outcome.ok ? outcome.value : outcome.error.message}
            </p>
          </div>
        </div>
        <LiveCode code={code} outcome={outcome} title="format.ts" animated={false} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-border bg-surface p-4">
          <p className="mb-3 text-sm font-medium">
            Every <code className="font-mono text-xs">FORMAT_PATTERNS</code> entry, live
          </p>
          <ul className="divide-y divide-border">
            {(Object.keys(FORMAT_PATTERNS) as (keyof typeof FORMAT_PATTERNS)[]).map(name => (
              <li key={name} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-1.5 font-mono text-xs">
                <span className="text-fg-muted">{name}</span>
                <span className="truncate" title={FORMAT_PATTERNS[name]}>
                  {formatWithPattern(now, zone, name)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              Another time, {hours === 0 ? 'right now' : `${Math.abs(hours)} hours ${hours < 0 ? 'ago' : 'from now'}`}
            </span>
            <input
              type="range"
              min={-240}
              max={240}
              value={hours}
              onChange={event => setHours(Number(event.target.value))}
              className="accent-[var(--accent)]"
            />
          </label>
          <ul className="flex flex-col gap-3">
            {helpers.map(helper => (
              <li key={helper.call} className="min-w-0">
                <code className="block truncate font-mono text-[0.7rem] text-fg-muted">{helper.call}</code>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={helper.value}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.12 }}
                    className="block font-mono text-sm"
                  >
                    {`'${helper.value}'`}
                  </motion.span>
                </AnimatePresence>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
