'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { convert, interpretLocal } from 'clockworktz'
import { useEngine, useMounted } from './engine-context'
import { DemoSkeleton, Field, Select, ZoneSelect } from './controls'
import { LiveCode } from './live-code'
import { attempt, lit } from '@/lib/demo/inspect'

const formats = [
  { value: '', label: 'Default (yyyy-MM-dd HH:mm:ss.SSS)' },
  { value: 'EEE d MMM, HH:mm', label: 'EEE d MMM, HH:mm' },
  { value: "h:mm a 'on' EEEE", label: "h:mm a 'on' EEEE" },
  { value: "yyyy-MM-dd'T'HH:mm:ssxxx", label: 'ISO 8601 with offset' },
] as const

const inputClass =
  'h-9 w-full min-w-0 rounded-lg border border-border bg-surface px-2.5 font-mono text-sm text-fg hover:border-border-strong focus:border-accent focus:outline-none'

/** Position of a wall time on a 24-hour track, 0–1 */
function dayFraction(local: string): number {
  const [h, m] = local.slice(11, 16).split(':').map(Number) as [number, number]
  return (h * 60 + m) / 1440
}

export function ConvertDemo() {
  const mounted = useMounted()
  const { rev } = useEngine()
  const [date, setDate] = useState('2024-09-12')
  const [time, setTime] = useState('10:00')
  const [from, setFrom] = useState('Europe/London')
  const [targets, setTargets] = useState(['America/Los_Angeles', 'Asia/Kathmandu', 'Australia/Lord_Howe', 'Pacific/Chatham'])
  const [pattern, setPattern] = useState<(typeof formats)[number]['value']>('EEE d MMM, HH:mm')
  const [selected, setSelected] = useState(0)

  if (!mounted) return <DemoSkeleton height={460} />

  const wall = `${date}T${time.length === 5 ? `${time}:00` : time}`
  const source = attempt(() => interpretLocal(wall, from))
  const results = targets.map(zone => ({
    zone,
    raw: attempt(() => convert(wall, from, zone)),
    shown: attempt(() => convert(wall, from, zone, pattern ? { format: pattern } : {})),
  }))
  const focus = results[selected] ?? results[0]!

  const opts = pattern ? `, {\n  format: ${lit(pattern)},\n}` : ''
  const code = `import { convert } from 'clockworktz'

// ${wall.slice(11, 16)} on ${date} in ${from}…
convert(${lit(wall)}, ${lit(from)}, ${lit(focus.zone)}${opts})`

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" data-rev={rev}>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Date">
            <input type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Wall time">
            <input type="time" step={60} value={time.slice(0, 5)} onChange={e => e.target.value && setTime(e.target.value)} className={inputClass} />
          </Field>
          <ZoneSelect label="In zone" value={from} onChange={setFrom} className="col-span-2" />
        </div>
        <Select label="Format" value={pattern} options={formats} onChange={setPattern} />

        <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2 text-xs text-fg-muted">
            <span>
              {source.ok ? (
                <>
                  Instant <span className="font-mono text-fg">{source.value.utc}</span>
                </>
              ) : (
                <span className="text-danger">{source.error.message}</span>
              )}
            </span>
            <span className="hidden font-mono sm:inline">00 · 06 · 12 · 18 · 24</span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {results.map((result, index) => {
              const active = index === selected
              const dayShift =
                result.raw.ok && source.ok
                  ? Math.round((Date.parse(`${result.raw.value.local.slice(0, 10)}T00:00Z`) - Date.parse(`${date}T00:00Z`)) / 86_400_000)
                  : 0
              return (
                <li key={index}>
                  <div
                    className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-xl border p-2.5 transition-colors sm:grid-cols-[11rem_minmax(0,1fr)_auto] ${
                      active ? 'border-accent bg-accent-soft' : 'border-transparent hover:bg-bg-subtle'
                    }`}
                  >
                    <div className="min-w-0">
                      <select
                        value={result.zone}
                        aria-label={`Target zone ${index + 1}`}
                        onChange={e => setTargets(targets.map((z, i) => (i === index ? e.target.value : z)))}
                        onFocus={() => setSelected(index)}
                        className="w-full truncate bg-transparent font-mono text-xs text-fg-muted focus:outline-none"
                      >
                        <option value={result.zone}>{result.zone}</option>
                        {['UTC', 'America/New_York', 'America/Sao_Paulo', 'Europe/Paris', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Eucla', 'Pacific/Kiritimati', 'Pacific/Marquesas', 'America/St_Johns', 'Antarctica/Troll']
                          .filter(z => z !== result.zone)
                          .map(z => (
                            <option key={z} value={z}>
                              {z}
                            </option>
                          ))}
                      </select>
                      <button type="button" onClick={() => setSelected(index)} className="block w-full text-left font-mono text-sm font-medium tabular-nums">
                        {result.shown.ok ? result.shown.value.local : '—'}
                      </button>
                    </div>
                    {/* 24-hour track: night shading at the ends, a marker at the local time */}
                    <div className="relative col-span-2 h-6 overflow-hidden rounded-full sm:col-span-1" aria-hidden="true">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grid)_0%,var(--grid)_25%,var(--bg-subtle)_25%,var(--bg-subtle)_75%,var(--grid)_75%)]" />
                      {result.raw.ok && (
                        <motion.div
                          className="absolute top-1 bottom-1 w-2 -translate-x-1/2 rounded-full bg-accent ring-2 ring-surface"
                          animate={{ left: `${dayFraction(result.raw.value.local) * 100}%` }}
                          transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                        />
                      )}
                    </div>
                    <div className="row-start-1 flex justify-end gap-1 sm:row-start-auto">
                      {result.raw.ok && (
                        <span className="rounded-full bg-bg-subtle px-2 py-0.5 font-mono text-[0.65rem] text-fg-muted">
                          {result.raw.value.abbreviation}
                        </span>
                      )}
                      {dayShift !== 0 && (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[0.65rem] text-accent">
                          {dayShift > 0 ? `+${dayShift}` : dayShift} day
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <LiveCode code={code} outcome={focus.shown} title="convert.ts" />
    </div>
  )
}
