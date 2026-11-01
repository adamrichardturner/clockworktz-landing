'use client'

import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { formatOffset, getZoneCountries, listTimeZones, type LabelStyle } from 'clockworktz'
import { useEngine, useMounted } from './engine-context'
import { DemoSkeleton, Segmented, Select } from './controls'
import { LiveCode } from './live-code'
import { useChartWidth } from './use-chart-width'
import { attempt, lit } from '@/lib/demo/inspect'

const H = 200
const M = { top: 12, right: 8, bottom: 30, left: 32 }

export function ZonesDemo() {
  const mounted = useMounted()
  // Drawn at one unit per pixel, so text is the same size at any width
  const [chartRef, W] = useChartWidth()
  const { rev, engine } = useEngine()
  const [season, setSeason] = useState<'01' | '07'>('07')
  const [labelStyle, setLabelStyle] = useState<LabelStyle>('offset')
  const [country, setCountry] = useState('')
  const [picked, setPicked] = useState<number | null>(345)
  const [hovered, setHovered] = useState<number | null>(null)

  const at = `2026-${season}-15T00:00:00Z`
  const all = useMemo(() => listTimeZones({ at, labelStyle }), [at, labelStyle, rev]) // eslint-disable-line react-hooks/exhaustive-deps
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames(['en'], { type: 'region' })
    const codes = new Set(all.flatMap(zone => zone.countryCodes))
    return [...codes].map(code => ({ value: code, label: `${names.of(code) ?? code} (${code})` })).sort((a, b) => a.label.localeCompare(b.label))
  }, [all])

  if (!mounted) return <DemoSkeleton height={520} />

  const inCountry = country ? all.filter(zone => zone.countryCodes.includes(country)) : all
  const byOffset = new Map<number, typeof all>()
  for (const zone of all) byOffset.set(zone.offsetMinutes, [...(byOffset.get(zone.offsetMinutes) ?? []), zone])
  const buckets = [...byOffset].sort(([a], [b]) => a - b)
  const max = Math.max(...buckets.map(([, zones]) => zones.length))
  const band = (W - M.left - M.right) / buckets.length
  const barW = Math.min(24, band - 2)
  const sy = (n: number) => H - M.bottom - (n / max) * (H - M.top - M.bottom)
  const shown = country ? inCountry : picked !== null ? all.filter(zone => zone.offsetMinutes === picked) : []
  const focus = hovered ?? picked
  const fractional = buckets.filter(([offset]) => offset % 60 !== 0).reduce((n, [, zones]) => n + zones.length, 0)

  const code = `import { listTimeZones, getZoneCountries } from 'clockworktz'

listTimeZones({
  at: ${lit(at)},
  labelStyle: ${lit(labelStyle)},${country ? `\n  country: ${lit(country)},` : ''}
})${country ? '' : `.filter(z => z.offsetMinutes === ${picked ?? 0})`}`
  const outcome = attempt(() => shown.slice(0, 6).map(({ value, label, offsetMinutes, countryCodes }) => ({ value, label, offsetMinutes, countryCodes })))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <Segmented
            label="Date"
            value={season}
            onChange={setSeason}
            options={[
              { value: '01', label: '15 January' },
              { value: '07', label: '15 July' },
            ]}
          />
          <Select
            label="labelStyle"
            value={labelStyle}
            onChange={setLabelStyle}
            options={['original', 'offset', 'abbrev', 'altName'] as const}
            className="w-32"
          />
          <Select
            label="Country"
            value={country}
            onChange={setCountry}
            options={[{ value: '', label: 'All countries' }, ...countries]}
            className="min-w-0 flex-1"
          />
        </div>

        <figure className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
          <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">
              {all.length} zones by UTC offset <span className="font-normal text-fg-muted">({engine})</span>
            </span>
            <span className="flex gap-3 text-xs text-fg-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-chart-blue" /> Whole hours
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-chart-amber" /> Half and quarter hours ({fractional})
              </span>
            </span>
          </figcaption>
          <div ref={chartRef}>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full select-none"
              role="img"
              aria-label="Number of time zones at each UTC offset. Choose a bar to list its zones."
            >
              {[0, Math.round(max / 2), max].map(n => (
                <g key={n}>
                  <line x1={M.left} x2={W - M.right} y1={sy(n)} y2={sy(n)} stroke="var(--grid)" />
                  <text x={M.left - 6} y={sy(n) + 3} textAnchor="end" className="fill-fg-faint font-mono text-[11px]">
                    {n}
                  </text>
                </g>
              ))}
              {buckets.map(([offset, zones], i) => {
                const x = M.left + i * band + (band - barW) / 2
                const y = sy(zones.length)
                const h = H - M.bottom - y
                const dim = country ? !zones.some(z => z.countryCodes.includes(country)) : picked !== null && offset !== picked && hovered !== offset
                return (
                  <g
                    key={offset}
                    role="button"
                    tabIndex={0}
                    aria-label={`UTC${formatOffset(offset)}: ${zones.length} zones`}
                    onClick={() => {
                      setCountry('')
                      setPicked(offset)
                    }}
                    onKeyDown={event => (event.key === 'Enter' || event.key === ' ') && setPicked(offset)}
                    onPointerEnter={() => setHovered(offset)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => setHovered(offset)}
                    onBlur={() => setHovered(null)}
                    className="cursor-pointer outline-none"
                  >
                    <rect x={M.left + i * band} y={M.top} width={band} height={H - M.top - M.bottom} fill="transparent" />
                    <motion.path
                      initial={false}
                      animate={{
                        d: `M${x},${H - M.bottom}V${y + Math.min(4, h)}q0,-4 4,-4h${barW - 8}q4,0 4,4V${H - M.bottom}Z`,
                        opacity: dim ? (country ? 0.25 : 0.5) : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                      fill={offset % 60 === 0 ? 'var(--chart-blue)' : 'var(--chart-amber)'}
                    />
                    {offset % 180 === 0 && (
                      <text x={x + barW / 2} y={H - 10} textAnchor="middle" className="fill-fg-faint font-mono text-[11px]">
                        {offset / 60 > 0 ? `+${offset / 60}` : offset / 60}
                      </text>
                    )}
                  </g>
                )
              })}
              {focus !== null &&
                buckets.some(([o]) => o === focus) &&
                (() => {
                  const i = buckets.findIndex(([o]) => o === focus)
                  const zones = buckets[i]![1]
                  const x = Math.min(Math.max(M.left + i * band + band / 2 - 85, 2), W - 172)
                  return (
                    <g pointerEvents="none" transform={`translate(${x}, ${M.top})`}>
                      <rect width="170" height="40" rx="6" fill="var(--surface)" stroke="var(--border-strong)" />
                      <text x="8" y="16" className="fill-fg font-mono text-[11px] font-semibold">
                        {zones.length} zone{zones.length === 1 ? '' : 's'} · UTC{formatOffset(focus)}
                      </text>
                      <text x="8" y="32" className="fill-fg-muted font-mono text-[11px]">
                        {zones[0]!.value.length > 22 ? `${zones[0]!.value.slice(0, 21)}…` : zones[0]!.value}
                      </text>
                    </g>
                  )
                })()}
            </svg>
          </div>
        </figure>

        <div className="max-h-64 overflow-y-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-surface text-fg-faint">
              <tr>
                <th className="px-3 py-2 font-medium">label</th>
                <th className="px-3 py-2 font-medium">getZoneCountries</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(zone => (
                <tr key={zone.value} className="border-t border-border">
                  <td className="px-3 py-1.5">{zone.label}</td>
                  <td className="px-3 py-1.5 text-fg-muted">{getZoneCountries(zone.value).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <LiveCode code={code} outcome={outcome} title="zones.ts" maxHeight="30rem" />
    </div>
  )
}
