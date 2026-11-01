'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { format, getZoneInfo } from 'clockworktz'
import { useEngine, useMounted } from './engine-context'
import { DemoSkeleton, ZoneSelect } from './controls'
import { LiveCode } from './live-code'
import { useNow } from './use-now'
import { lit } from '@/lib/demo/inspect'

function ClockFace({ now, offsetSeconds }: { now: Date; offsetSeconds: number }) {
  // Angles grow forever (never wrap to 0), so hands never sweep backwards
  const wallSeconds = Math.floor(now.getTime() / 1000) + offsetSeconds
  const second = wallSeconds * 6
  const minute = wallSeconds / 10
  const hour = wallSeconds / 120
  const hand = (angle: number, length: number, width: number, color: string) => (
    <line
      x1="50"
      y1="50"
      x2="50"
      y2={50 - length}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      style={{ transform: `rotate(${angle}deg)`, transformOrigin: '50px 50px', transition: 'transform 0.35s cubic-bezier(.4,1.6,.6,1)' }}
    />
  )
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1={i % 5 === 0 ? 7 : 8.5}
          x2="50"
          y2="11"
          stroke={i % 5 === 0 ? 'var(--fg-muted)' : 'var(--border-strong)'}
          strokeWidth={i % 5 === 0 ? 1.6 : 0.8}
          strokeLinecap="round"
          transform={`rotate(${i * 6} 50 50)`}
        />
      ))}
      {hand(hour, 24, 3.5, 'var(--fg)')}
      {hand(minute, 34, 2.5, 'var(--fg)')}
      {hand(second, 38, 1.2, 'var(--accent)')}
      <circle cx="50" cy="50" r="2.6" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1" />
    </svg>
  )
}

const initialZones = ['Australia/Lord_Howe', 'Asia/Kathmandu', 'Pacific/Chatham', 'America/St_Johns']

export function ClocksDemo() {
  const mounted = useMounted()
  const { rev } = useEngine()
  const now = useNow(1000)
  const [zones, setZones] = useState(initialZones)
  const [adding, setAdding] = useState('Pacific/Marquesas')

  if (!mounted || !now) return <DemoSkeleton height={420} />

  const code = `import { onTick, format, getZoneInfo } from 'clockworktz'

const stop = onTick(now => {
${zones.map(zone => `  format(now, ${lit(zone)}, 'HH:mm:ss xxx zzz')`).join('\n')}
}, 1000)`

  const output = zones.map(zone => `'${format(now, zone, 'HH:mm:ss xxx zzz')}'`).join('\n')

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" data-rev={rev}>
      <div className="min-w-0">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {zones.map(zone => {
              const info = getZoneInfo(now, zone)
              return (
                <motion.li
                  key={zone}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-3"
                >
                  <button
                    type="button"
                    onClick={() => setZones(zones.filter(z => z !== zone))}
                    aria-label={`Remove ${zone}`}
                    className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full text-fg-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-bg-subtle hover:text-fg focus-visible:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                  <div className="aspect-square w-full max-w-28">
                    <ClockFace now={now} offsetSeconds={info.offsetSeconds} />
                  </div>
                  <div className="font-mono text-lg font-medium tabular-nums">{format(now, zone, 'HH:mm:ss')}</div>
                  <div className="w-full truncate text-center font-mono text-[0.7rem] text-fg-muted" title={zone}>
                    {zone}
                  </div>
                  <div className="flex flex-wrap justify-center gap-1">
                    <span className="rounded-full bg-bg-subtle px-2 py-0.5 font-mono text-[0.65rem] text-fg-muted">
                      {format(now, zone, 'xxx')}
                    </span>
                    <span className="rounded-full bg-bg-subtle px-2 py-0.5 font-mono text-[0.65rem] text-fg-muted">
                      {info.abbreviation}
                    </span>
                    {info.isDST && (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[0.65rem] text-accent">DST</span>
                    )}
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
        <div className="mt-4 flex items-end gap-2">
          <ZoneSelect label="Add a clock" value={adding} onChange={setAdding} className="flex-1" />
          <button
            type="button"
            disabled={zones.includes(adding) || zones.length >= 8}
            onClick={() => setZones([...zones, adding])}
            className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
      <LiveCode code={code} output={output} title="clocks.ts" animated={false} />
    </div>
  )
}
