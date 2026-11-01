'use client'

import { useMemo } from 'react'
import { listTimeZones } from 'clockworktz'
import { useEngine } from './engine-context'

const fieldClass =
  'h-9 w-full min-w-0 rounded-lg border border-border bg-surface px-2.5 font-mono text-sm text-fg transition-colors hover:border-border-strong focus:border-accent focus:outline-none'

export function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-fg-muted">{label}</span>
      {children}
    </label>
  )
}

/** Every zone the active engine lists, grouped by region, labelled with today's offset */
export function ZoneSelect({
  value,
  onChange,
  label = 'Zone',
  className,
}: {
  value: string
  onChange: (zone: string) => void
  label?: string
  className?: string
}) {
  const { rev } = useEngine()
  const groups = useMemo(() => {
    const byRegion = new Map<string, { value: string; label: string }[]>()
    for (const zone of listTimeZones({ labelStyle: 'offset' })) {
      const region = zone.value.includes('/') ? zone.value.split('/')[0]! : 'Other'
      byRegion.set(region, [...(byRegion.get(region) ?? []), zone])
    }
    return [...byRegion].sort(([a], [b]) => a.localeCompare(b))
    // rev: the zone list depends on the active engine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rev])
  const listed = groups.some(([, zones]) => zones.some(zone => zone.value === value))

  return (
    <Field label={label} className={className}>
      <select value={value} onChange={event => onChange(event.target.value)} className={fieldClass}>
        {!listed && <option value={value}>{value}</option>}
        {groups.map(([region, zones]) => (
          <optgroup key={region} label={region}>
            {zones.map(zone => (
              <option key={zone.value} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </Field>
  )
}

export function TextInput({
  label,
  value,
  onChange,
  invalid,
  className,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  className?: string
  placeholder?: string
}) {
  return (
    <Field label={label} className={className}>
      <input
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        onChange={event => onChange(event.target.value)}
        aria-invalid={invalid || undefined}
        className={`${fieldClass} ${invalid ? 'border-danger!' : ''}`}
      />
    </Field>
  )
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: T
  options: readonly (T | { value: T; label: string })[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <Field label={label} className={className}>
      <select value={value} onChange={event => onChange(event.target.value as T)} className={fieldClass}>
        {options.map(option => {
          const item = typeof option === 'string' ? { value: option, label: option } : option
          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          )
        })}
      </select>
    </Field>
  )
}

/** Pill buttons for a small set of choices */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            option.value === value
              ? 'border-accent bg-accent text-accent-fg'
              : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** A block shown in place of a demo until it runs in the browser */
export function DemoSkeleton({ height = 360 }: { height?: number }) {
  return <div className="animate-pulse rounded-2xl border border-border bg-bg-subtle" style={{ height }} aria-hidden="true" />
}
