'use client'

import { useId, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { format, fromUTC, getTransitions, interpretLocal, type Disambiguation } from 'clockworktz'
import { useEngine, useMounted } from './engine-context'
import { DemoSkeleton, Field, Segmented, ZoneSelect } from './controls'
import { LiveCode } from './live-code'
import { useChartWidth } from './use-chart-width'
import { attempt, lit } from '@/lib/demo/inspect'

const presets = [
  { id: 'ny-spring', label: 'New York, spring', zone: 'America/New_York', wall: '2024-03-10T02:30' },
  { id: 'ny-fall', label: 'New York, fall', zone: 'America/New_York', wall: '2024-11-03T01:30' },
  { id: 'lh-spring', label: 'Lord Howe, 30 min', zone: 'Australia/Lord_Howe', wall: '2024-10-06T02:15' },
  { id: 'lh-fall', label: 'Lord Howe, overlap', zone: 'Australia/Lord_Howe', wall: '2024-04-07T01:45' },
  { id: 'troll', label: 'Troll, 2-hour DST', zone: 'Antarctica/Troll', wall: '2024-03-31T02:00' },
  { id: 'samoa', label: 'Samoa, lost day', zone: 'Pacific/Apia', wall: '2011-12-30T12:00' },
] as const

const strategies: Disambiguation[] = ['compatible', 'earliest', 'latest', 'reject']
const HOUR = 3_600_000

// Chart geometry (SVG user units)
const H = 300
const M = { top: 26, right: 16, bottom: 34, left: 60 }

/** Round time ticks (whole hours or tidy fractions) covering [a, b], at most `max` of them */
function timeTicks(a: number, b: number, max: number): number[] {
  const steps = [15, 30, 60, 120, 180, 360, 720, 1440].map(m => m * 60_000)
  const step = steps.find(s => (b - a) / s <= max - 1) ?? steps[steps.length - 1]!
  const ticks: number[] = []
  for (let t = Math.ceil(a / step) * step; t <= b; t += step) ticks.push(t)
  return ticks
}

export function DstLab() {
  const mounted = useMounted()
  // Drawn at one unit per pixel, so text is the same size at any width
  const [chartRef, W] = useChartWidth()
  const { rev } = useEngine()
  const [zone, setZone] = useState<string>(presets[0].zone)
  const [wallInput, setWallInput] = useState<string>(presets[0].wall)
  const [strategy, setStrategy] = useState<Disambiguation>('compatible')
  const [hoverX, setHoverX] = useState<number | null>(null)
  const clipId = useId()

  const wall = `${wallInput}:00`
  const model = useMemo(() => {
    const early = attempt(() => interpretLocal(wall, zone, { disambiguation: 'earliest' }))
    const late = attempt(() => interpretLocal(wall, zone, { disambiguation: 'latest' }))
    if (!early.ok || !late.ok) return null
    const earlyMs = Date.parse(early.value.utc)
    const lateMs = Date.parse(late.value.utc)
    const kind = earlyMs === lateMs ? 'normal' : early.value.local === late.value.local ? 'repeated' : 'skipped'
    const nearby = getTransitions(zone, earlyMs - 3 * 24 * HOUR, lateMs + 3 * 24 * HOUR)
    const transition =
      kind === 'normal'
        ? undefined
        : nearby.reduce<(typeof nearby)[number] | undefined>(
            (best, t) => (!best || Math.abs(t.date.getTime() - earlyMs) < Math.abs(best.date.getTime() - earlyMs) ? t : best),
            undefined,
          )
    const center = transition ? transition.date.getTime() : earlyMs
    const jump = transition ? Math.abs(transition.toOffset - transition.fromOffset) * 60_000 : 0
    const half = Math.max(3 * HOUR, jump * 1.5)
    const x0 = center - half
    const x1 = center + half
    const offAt = (ms: number) => fromUTC(ms, zone).offsetMinutes * 60_000
    const segments: [number, number, number][] = transition
      ? [
          [x0, center, transition.fromOffset * 60_000],
          [center, x1, transition.toOffset * 60_000],
        ]
      : [[x0, x1, offAt(center)]]
    const ys = segments.flatMap(([a, b, off]) => [a + off, b + off])
    return { early: early.value, late: late.value, earlyMs, lateMs, kind, transition, x0, x1, segments, y0: Math.min(...ys), y1: Math.max(...ys) }
    // rev: results depend on the active engine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wall, zone, rev])

  if (!mounted) return <DemoSkeleton height={560} />

  const wallMs = Date.parse(`${wall}Z`)
  const outcomes = strategies.map(option => ({ option, result: attempt(() => interpretLocal(wall, zone, { disambiguation: option })) }))
  const chosen = outcomes.find(o => o.option === strategy)!
  const code = `import { interpretLocal } from 'clockworktz'

interpretLocal(${lit(wall)}, ${lit(zone)}, {
  disambiguation: ${lit(strategy)},
})`

  // Scales
  const sx = (ms: number) => (model ? M.left + ((ms - model.x0) / (model.x1 - model.x0)) * (W - M.left - M.right) : 0)
  const sy = (ms: number) => (model ? H - M.bottom - ((ms - model.y0) / (model.y1 - model.y0 || 1)) * (H - M.top - M.bottom) : 0)
  const longSpan = model ? model.x1 - model.x0 > 20 * HOUR : false
  // Multi-day spans label midnights with the date, everything else with the time
  const tickLabel = (ms: number) => format(ms, 'UTC', longSpan && ms % (24 * HOUR) === 0 ? 'd MMM' : 'HH:mm')
  const hover = model && hoverX !== null ? fromUTC(hoverX, zone) : null

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <Segmented
          label="Scenario"
          value={presets.find(p => p.zone === zone && p.wall === wallInput)?.id ?? ''}
          options={presets.map(p => ({ value: p.id, label: p.label }))}
          onChange={id => {
            const preset = presets.find(p => p.id === id)!
            setZone(preset.zone)
            setWallInput(preset.wall)
            setHoverX(null)
          }}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <ZoneSelect value={zone} onChange={setZone} />
          <Field label="Wall time">
            <input
              type="datetime-local"
              value={wallInput}
              onChange={e => e.target.value && setWallInput(e.target.value.slice(0, 16))}
              className="h-9 w-full min-w-0 rounded-lg border border-border bg-surface px-2.5 font-mono text-sm text-fg hover:border-border-strong focus:border-accent focus:outline-none"
            />
          </Field>
        </div>

        <figure className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
          <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">Wall clock against UTC around the change</span>
            {model && (
              <motion.span
                key={model.kind}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${
                  model.kind === 'normal' ? 'bg-bg-subtle text-fg-muted' : 'bg-accent-soft text-accent'
                }`}
              >
                {model.kind === 'skipped'
                  ? `${wallInput.slice(11)} is skipped`
                  : model.kind === 'repeated'
                    ? `${wallInput.slice(11)} happens twice`
                    : `${wallInput.slice(11)} is unambiguous`}
              </motion.span>
            )}
          </figcaption>
          {model ? (
            <div ref={chartRef}>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full touch-none select-none"
                role="img"
                aria-label={`Wall-clock time in ${zone} plotted against UTC. ${model.kind === 'normal' ? 'No transition nearby.' : `At ${model.transition?.date.toISOString()} the offset changes from ${model.transition?.fromOffset} to ${model.transition?.toOffset} minutes.`}`}
                onPointerMove={event => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  const x = ((event.clientX - rect.left) / rect.width) * W
                  if (x < M.left || x > W - M.right) return setHoverX(null)
                  setHoverX(model.x0 + ((x - M.left) / (W - M.left - M.right)) * (model.x1 - model.x0))
                }}
                onPointerLeave={() => setHoverX(null)}
              >
                <defs>
                  <clipPath id={clipId}>
                    <rect x={M.left} y={M.top} width={W - M.left - M.right} height={H - M.top - M.bottom} />
                  </clipPath>
                  <pattern id={`${clipId}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="6" stroke="var(--chart-amber)" strokeWidth="1.5" opacity="0.45" />
                  </pattern>
                </defs>
                {/* Grid and axes */}
                {timeTicks(model.y0, model.y1, 6).map(y => (
                  <g key={`y${y}`}>
                    <line x1={M.left} x2={W - M.right} y1={sy(y)} y2={sy(y)} stroke="var(--grid)" />
                    <text x={M.left - 8} y={sy(y) + 4} textAnchor="end" className="fill-fg-faint font-mono text-[11px]">
                      {tickLabel(y)}
                    </text>
                  </g>
                ))}
                {timeTicks(model.x0, model.x1, Math.max(3, Math.floor((W - M.left) / (longSpan ? 90 : 70)))).map(x => (
                  <text key={`x${x}`} x={sx(x)} y={H - M.bottom + 16} textAnchor="middle" className="fill-fg-faint font-mono text-[11px]">
                    {tickLabel(x)}
                  </text>
                ))}
                <text x={W - M.right} y={H - 4} textAnchor="end" className="fill-fg-muted text-[11px]">
                  UTC →
                </text>
                <text x={M.left - 8} y={12} textAnchor="end" className="fill-fg-muted text-[11px]">
                  Local ↑
                </text>

                <g clipPath={`url(#${clipId})`}>
                  {/* The skipped or repeated band of wall-clock time */}
                  {model.transition && (
                    <motion.rect
                      key={`band-${model.kind}-${model.transition.date.getTime()}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      x={M.left}
                      width={W - M.left - M.right}
                      y={sy(model.transition.date.getTime() + Math.max(model.transition.fromOffset, model.transition.toOffset) * 60_000)}
                      height={Math.abs(
                        sy(model.transition.date.getTime() + model.transition.fromOffset * 60_000) -
                          sy(model.transition.date.getTime() + model.transition.toOffset * 60_000),
                      )}
                      fill={model.kind === 'skipped' ? `url(#${clipId}-hatch)` : 'var(--chart-amber)'}
                      fillOpacity={model.kind === 'skipped' ? 1 : 0.12}
                    />
                  )}
                  {/* Requested wall time */}
                  <line x1={M.left} x2={W - M.right} y1={sy(wallMs)} y2={sy(wallMs)} stroke="var(--fg-muted)" strokeWidth="1" />
                  <text x={W - M.right - 4} y={sy(wallMs) - 6} textAnchor="end" className="fill-fg-muted font-mono text-[11px]">
                    {wallInput.slice(11)} wall time
                  </text>
                  {/* Offset segments */}
                  {model.segments.map(([a, b, off], i) => (
                    <motion.line
                      key={`${zone}-${wall}-${i}-${rev}`}
                      x1={sx(a)}
                      y1={sy(a + off)}
                      x2={sx(b)}
                      y2={sy(b + off)}
                      stroke="var(--chart-blue)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: i * 0.35, ease: 'easeOut' }}
                    />
                  ))}
                  {/* Where each strategy lands */}
                  {[
                    { ms: model.earlyMs, off: model.early.offsetMinutes, label: model.kind === 'repeated' ? 'earliest · compatible' : 'earliest' },
                    {
                      ms: model.lateMs,
                      off: model.late.offsetMinutes,
                      label: model.kind === 'skipped' ? 'latest · compatible' : model.kind === 'repeated' ? 'latest' : 'every strategy',
                    },
                  ]
                    .filter((p, i) => i === 1 || model.kind !== 'normal')
                    .map(p => (
                      <motion.g
                        key={`${p.label}-${p.ms}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, type: 'spring' }}
                        style={{ transformOrigin: `${sx(p.ms)}px ${sy(p.ms + p.off * 60_000)}px` }}
                      >
                        <line
                          x1={sx(p.ms)}
                          x2={sx(p.ms)}
                          y1={sy(p.ms + p.off * 60_000)}
                          y2={H - M.bottom}
                          stroke="var(--chart-amber)"
                          strokeWidth="1"
                          opacity="0.6"
                        />
                        <circle cx={sx(p.ms)} cy={sy(p.ms + p.off * 60_000)} r="5" fill="var(--chart-amber)" stroke="var(--surface)" strokeWidth="2" />
                        <text
                          x={sx(p.ms) + 8}
                          y={sy(p.ms + p.off * 60_000) + (p.label.startsWith('earliest') ? 14 : -8)}
                          className="fill-fg font-mono text-[11px]"
                        >
                          {p.label}
                        </text>
                      </motion.g>
                    ))}
                </g>
                {/* Hover crosshair, computed with fromUTC */}
                {hover && hoverX !== null && (
                  <g pointerEvents="none">
                    <line x1={sx(hoverX)} x2={sx(hoverX)} y1={M.top} y2={H - M.bottom} stroke="var(--fg-faint)" strokeWidth="1" />
                    <circle
                      cx={sx(hoverX)}
                      cy={sy(hoverX + hover.offsetMinutes * 60_000)}
                      r="4"
                      fill="var(--chart-blue)"
                      stroke="var(--surface)"
                      strokeWidth="2"
                    />
                    <g transform={`translate(${Math.min(sx(hoverX) + 8, W - M.right - 176)}, ${M.top + 4})`}>
                      <rect width="176" height="42" rx="6" fill="var(--surface)" stroke="var(--border-strong)" />
                      <text x="8" y="15" className="fill-fg font-mono text-[11px]">
                        {hover.local.slice(0, 16)} {hover.abbreviation}
                      </text>
                      <text x="8" y="33" className="fill-fg-muted font-mono text-[11px]">
                        {hover.utc.slice(0, 16).replace('T', ' ')} UTC
                      </text>
                    </g>
                  </g>
                )}
              </svg>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-danger">Enter a valid wall time.</p>
          )}
          {model?.transition && (
            <p className="mt-1 text-xs text-fg-muted">
              The offset changes from <span className="font-mono text-fg">{model.transition.fromAbbreviation}</span> to{' '}
              <span className="font-mono text-fg">{model.transition.toAbbreviation}</span> at{' '}
              <span className="font-mono text-fg">{model.transition.date.toISOString().replace('.000Z', 'Z')}</span>. Hover the line to read any instant.
            </p>
          )}
        </figure>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {outcomes.map(({ option, result }) => (
            <button
              key={option}
              type="button"
              onClick={() => setStrategy(option)}
              aria-pressed={option === strategy}
              className={`relative rounded-xl border p-3 text-left transition-colors ${
                option === strategy ? 'border-accent bg-accent-soft' : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              <span className="block font-mono text-xs font-semibold">{option}</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={result.ok ? result.value.utc : result.error.name}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-1 block font-mono text-[0.72rem] leading-snug"
                >
                  {result.ok ? (
                    <>
                      <span className="text-fg">{result.value.local.slice(0, 16)}</span> <span className="text-fg-muted">{result.value.abbreviation}</span>
                    </>
                  ) : (
                    <span className="text-danger">throws {result.error.name}</span>
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          ))}
        </div>
        <LiveCode code={code} outcome={chosen.result} title="disambiguation.ts" />
      </div>
    </div>
  )
}
