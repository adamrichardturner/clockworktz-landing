'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { AmbiguousTimeError, InvalidTimeError, TimezoneError, format, fromUTC, initClockworkTZ, interpretLocal } from 'clockworktz'
import { useEngine, useMounted } from './engine-context'
import { DemoSkeleton } from './controls'
import { LiveCode } from './live-code'
import { attempt } from '@/lib/demo/inspect'

const cases = [
  { label: 'Unknown zone', code: "fromUTC('2024-07-15T14:00:00Z', 'Mars/Olympus_Mons')", run: () => fromUTC('2024-07-15T14:00:00Z', 'Mars/Olympus_Mons') },
  { label: 'Instant without offset', code: "fromUTC('2024-07-15T14:00:00', 'UTC')", run: () => fromUTC('2024-07-15T14:00:00', 'UTC') },
  { label: '30 February', code: "interpretLocal('2024-02-30T10:00:00', 'UTC')", run: () => interpretLocal('2024-02-30T10:00:00', 'UTC') },
  { label: 'Unsupported token', code: "format(new Date(), 'UTC', 'Qo')", run: () => format(new Date(), 'UTC', 'Qo') },
  {
    label: 'Bad options',
    code: "initClockworkTZ({ manifestURL: 'https://example.com/m.json' })",
    run: () => initClockworkTZ({ manifestURL: 'https://example.com/m.json' }),
  },
  {
    label: 'Skipped time, reject',
    code: "interpretLocal('2024-03-10T02:30:00', 'America/New_York', {\n  disambiguation: 'reject',\n})",
    run: () => interpretLocal('2024-03-10T02:30:00', 'America/New_York', { disambiguation: 'reject' }),
  },
  {
    label: 'Repeated time, reject',
    code: "interpretLocal('2024-11-03T01:30:00', 'America/New_York', {\n  disambiguation: 'reject',\n})",
    run: () => interpretLocal('2024-11-03T01:30:00', 'America/New_York', { disambiguation: 'reject' }),
  },
] as const

const tree = [
  { name: 'TimezoneError', depth: 0, cls: TimezoneError },
  { name: 'InvalidTimeError', depth: 1, cls: InvalidTimeError },
  { name: 'AmbiguousTimeError', depth: 1, cls: AmbiguousTimeError },
] as const

export function ErrorsDemo() {
  const mounted = useMounted()
  const { rev } = useEngine()
  const [index, setIndex] = useState(0)

  if (!mounted) return <DemoSkeleton height={360} />

  const current = cases[index]!
  const outcome = attempt<unknown>(current.run)
  const error = outcome.ok ? undefined : outcome.error
  const code = `import { TimezoneError, InvalidTimeError, AmbiguousTimeError } from 'clockworktz'

try {
  ${current.code.replace(/\n/g, '\n  ')}
} catch (error) {
  error instanceof TimezoneError // ${error instanceof TimezoneError}
}`

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" data-rev={rev}>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {cases.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                i === index ? 'border-accent bg-accent-soft text-fg' : 'border-border bg-surface text-fg-muted hover:text-fg'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="mb-3 text-xs font-medium text-fg-muted">Which classes match with instanceof</p>
          <ul className="flex flex-col gap-2 font-mono text-sm">
            <li className="text-fg-faint">Error</li>
            {tree.map(node => {
              const match = error instanceof node.cls
              return (
                <li key={node.name} style={{ paddingLeft: `${(node.depth + 1) * 1.25}rem` }} className="relative">
                  <motion.span
                    animate={{ scale: match ? 1.04 : 1 }}
                    className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 transition-colors ${
                      match ? 'border-danger text-fg' : 'border-border text-fg-faint'
                    }`}
                  >
                    <span className={`size-2 rounded-full transition-colors ${match ? 'bg-danger' : 'bg-border-strong'}`} />
                    {node.name}
                  </motion.span>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-sm text-fg-muted">
            Everything clockworktz throws is a <span className="font-mono text-fg">TimezoneError</span>, so one catch handles every failure, and the
            two subclasses tell DST gaps from overlaps.
          </p>
        </div>
      </div>
      <LiveCode code={code} outcome={outcome} title="errors.ts" />
    </div>
  )
}
