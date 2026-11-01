'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { format, formatOffset, getNextTransition, getTransitions, getZoneInfo, watchZoneTransitions } from 'clockworktz'
import { useEngine, useMounted } from './engine-context'
import { DemoSkeleton, Select, ZoneSelect } from './controls'
import { LiveCode } from './live-code'
import { useChartWidth } from './use-chart-width'
import { useNow } from './use-now'
import { attempt, lit } from '@/lib/demo/inspect'

const H = 220
const M = { top: 14, right: 14, bottom: 26, left: 64 }
const years = ['2011', '2015', '2016', '2018', '2024', '2025', '2026', '2027', '2100'] as const

function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86_400)
  const hh = String(Math.floor((s % 86_400) / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${d}d ${hh}:${mm}:${ss}`
}

export function TransitionsDemo() {
  const mounted = useMounted()
  // Drawn at one unit per pixel, so text is the same size at any width
  const [chartRef, W] = useChartWidth()
  const { rev } = useEngine()
  const now = useNow(1000)
  const [zone, setZone] = useState('Pacific/Chatham')
  const [year, setYear] = useState<(typeof years)[number]>('2024')
  const [hoverX, setHoverX] = useState<number | null>(null)
  const [fired, setFired] = useState<string[]>([])

  // A real watcher: fires the moment this zone next changes offset
  useEffect(() => watchZoneTransitions(zone, at => setFired(list => [`${zone} changed at ${at.toISOString()}`, ...list])), [zone, rev])

  const start = Date.UTC(Number(year), 0, 1)
  const end = Date.UTC(Number(year) + 1, 0, 1)
  const model = useMemo(() => {
    const transitions = getTransitions(zone, start, end)
    const startInfo = getZoneInfo(start, zone)
    const points: [number, number][] = [[start, startInfo.offsetSeconds / 60]]
    for (const t of transitions) points.push([t.date.getTime(), t.toOffset])
    const offsets = points.map(([, o]) => o)
    const lo = Math.min(...offsets)
    const hi = Math.max(...offsets)
    const pad = Math.max(30, (hi - lo) * 0.4)
    return { transitions, points, y0: lo - pad, y1: hi + pad }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone, start, end, rev])

  if (!mounted || !now) return <DemoSkeleton height={460} />

  const next = getNextTransition(zone, now)
  const sx = (ms: number) => M.left + ((ms - start) / (end - start)) * (W - M.left - M.right)
  const sy = (min: number) => H - M.bottom - ((min - model.y0) / (model.y1 - model.y0)) * (H - M.top - M.bottom)
  let d = ''
  model.points.forEach(([ms, off], i) => {
    d += i === 0 ? `M${sx(ms)},${sy(off)}` : `H${sx(ms)}V${sy(off)}`
  })
  d += `H${sx(end)}`
  const hover = hoverX !== null ? getZoneInfo(hoverX, zone) : null

  const code = `import { getTransitions, getNextTransition, watchZoneTransitions } from 'clockworktz'

getTransitions(${lit(zone)}, '${year}-01-01T00:00:00Z', '${Number(year) + 1}-01-01T00:00:00Z')

// And live: re-render the moment the offset changes
watchZoneTransitions(${lit(zone)}, at => rerender(at))`
  const outcome = attempt(() => model.transitions)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
          <ZoneSelect value={zone} onChange={setZone} />
          <Select label="Year" value={year} options={years} onChange={setYear} />
        </div>

        <figure className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
          <figcaption className="mb-2 text-sm font-medium">
            UTC offset of {zone} through {year}
            <span className="ml-2 font-normal text-fg-muted">
              {model.transitions.length === 0 ? 'no transitions' : `${model.transitions.length} transition${model.transitions.length === 1 ? '' : 's'}`}
            </span>
          </figcaption>
          <div ref={chartRef}>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full touch-none select-none"
              role="img"
              aria-label={`Step chart of the UTC offset of ${zone} in ${year}. Details are in the table below.`}
              onPointerMove={event => {
                const rect = event.currentTarget.getBoundingClientRect()
                const x = ((event.clientX - rect.left) / rect.width) * W
                setHoverX(x < M.left || x > W - M.right ? null : start + ((x - M.left) / (W - M.left - M.right)) * (end - start))
              }}
              onPointerLeave={() => setHoverX(null)}
            >
              {Array.from({ length: 5 }, (_, i) => model.y0 + ((model.y1 - model.y0) * i) / 4).map(min => (
                <g key={min}>
                  <line x1={M.left} x2={W - M.right} y1={sy(min)} y2={sy(min)} stroke="var(--grid)" />
                  <text x={M.left - 8} y={sy(min) + 4} textAnchor="end" className="fill-fg-faint font-mono text-[11px]">
                    {formatOffset(Math.round(min))}
                  </text>
                </g>
              ))}
              {Array.from({ length: 12 }, (_, m) => Date.UTC(Number(year), m, 1))
                .filter((_, m) => W >= 480 || m % 2 === 0)
                .map(ms => (
                  <text key={ms} x={sx(ms) + 2} y={H - 8} className="fill-fg-faint font-mono text-[11px]">
                    {format(ms, 'UTC', 'MMM')}
                  </text>
                ))}
              <motion.path
                key={`${zone}-${year}-${rev}`}
                d={d}
                fill="none"
                stroke="var(--chart-blue)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
              />
              {model.transitions.map(t => (
                <motion.circle
                  key={`${zone}-${t.date.getTime()}`}
                  cx={sx(t.date.getTime())}
                  cy={sy(t.toOffset)}
                  r="4.5"
                  fill="var(--chart-amber)"
                  stroke="var(--surface)"
                  strokeWidth="2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: 'spring' }}
                />
              ))}
              {hover && hoverX !== null && (
                <g pointerEvents="none">
                  <line x1={sx(hoverX)} x2={sx(hoverX)} y1={M.top} y2={H - M.bottom} stroke="var(--fg-faint)" />
                  <circle cx={sx(hoverX)} cy={sy(hover.offsetSeconds / 60)} r="4" fill="var(--chart-blue)" stroke="var(--surface)" strokeWidth="2" />
                  <g transform={`translate(${Math.min(sx(hoverX) + 8, W - M.right - 172)}, ${M.top})`}>
                    <rect width="172" height="42" rx="6" fill="var(--surface)" stroke="var(--border-strong)" />
                    <text x="8" y="15" className="fill-fg font-mono text-[11px]">
                      {formatOffset(hover.offsetSeconds / 60)} {hover.abbreviation} {hover.isDST ? '· DST' : ''}
                    </text>
                    <text x="8" y="33" className="fill-fg-muted font-mono text-[11px]">
                      {format(hoverX, 'UTC', 'd MMM yyyy HH:mm')} UTC
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-fg-faint">
                <tr>
                  <th className="py-1 pr-3 font-medium">Instant (UTC)</th>
                  <th className="py-1 pr-3 font-medium">From</th>
                  <th className="py-1 pr-3 font-medium">To</th>
                  <th className="py-1 font-medium">Kind</th>
                </tr>
              </thead>
              <tbody>
                {model.transitions.map(t => (
                  <tr key={t.date.getTime()} className="border-t border-border">
                    <td className="py-1.5 pr-3 whitespace-nowrap">{t.date.toISOString().replace('.000Z', 'Z')}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap text-fg-muted">
                      {formatOffset(t.fromOffset)} {t.fromAbbreviation}
                    </td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">
                      {formatOffset(t.toOffset)} {t.toAbbreviation}
                    </td>
                    <td className="py-1.5 whitespace-nowrap text-fg-muted">
                      {t.isDSTStart ? 'DST starts' : t.isDSTEnd ? 'DST ends' : 'Standard time changes'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-fg-muted">Next change in {zone}</p>
          {next ? (
            <>
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">{countdown(next.date.getTime() - now.getTime())}</p>
              <p className="mt-1 font-mono text-xs text-fg-muted">
                {format(next.date, zone, 'EEE d MMM yyyy, HH:mm')} local · {formatOffset(next.fromOffset)} → {formatOffset(next.toOffset)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-fg-muted">No transitions in the next two years.</p>
          )}
          {fired.length > 0 && <p className="mt-2 font-mono text-xs text-success">{fired[0]}</p>}
        </div>
        <LiveCode code={code} outcome={outcome} title="transitions.ts" />
      </div>
    </div>
  )
}
