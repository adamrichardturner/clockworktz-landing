'use client'

import { useState } from 'react'
import { parse, parseOffset, safeParse } from 'clockworktz'
import { useEngine, useMounted } from './engine-context'
import { DemoSkeleton, Segmented, TextInput, ZoneSelect } from './controls'
import { LiveCode } from './live-code'
import { attempt, inspect, lit } from '@/lib/demo/inspect'

const samples = [
  { label: 'With offset', value: '2024-07-15T14:00:00+05:45' },
  { label: 'Wall time', value: '2024-07-15T14:00:00' },
  { label: 'Date only', value: '2024-07-15' },
  { label: 'Spring-forward gap', value: '2024-03-10T02:30:00' },
  { label: 'RFC 2822', value: 'Mon, 15 Jul 2024 14:00:00 GMT' },
  { label: '30 February', value: '2024-02-30T10:00:00' },
  { label: 'Prose', value: 'next tuesday' },
] as const

export function ParseDemo() {
  const mounted = useMounted()
  const { rev } = useEngine()
  const [input, setInput] = useState<string>(samples[1].value)
  const [zone, setZone] = useState('America/New_York')
  const [mode, setMode] = useState<'parse' | 'loose' | 'safe'>('parse')
  const [offset, setOffset] = useState('+05:45')

  if (!mounted) return <DemoSkeleton height={420} />

  const options = `{ defaultTimezone: ${lit(zone)}${mode === 'loose' ? ', strict: false' : ''} }`
  const call = mode === 'safe' ? 'safeParse' : 'parse'
  const outcome =
    mode === 'safe'
      ? attempt(() => safeParse(input, { defaultTimezone: zone }))
      : attempt(() => parse(input, { defaultTimezone: zone, strict: mode === 'parse' }))
  const code = `import { ${call} } from 'clockworktz'

${call}(${lit(input)}, ${options})`
  const offsetResult = attempt(() => parseOffset(offset))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" data-rev={rev}>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {samples.map(sample => (
            <button
              key={sample.label}
              type="button"
              onClick={() => setInput(sample.value)}
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                input === sample.value ? 'border-accent bg-accent-soft text-fg' : 'border-border bg-surface text-fg-muted hover:text-fg'
              }`}
            >
              {sample.label}
            </button>
          ))}
        </div>
        <TextInput label="Input" value={input} onChange={setInput} />
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
          <ZoneSelect label="defaultTimezone (for wall times)" value={zone} onChange={setZone} />
          <Segmented
            label="Function"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'parse', label: 'parse (strict)' },
              { value: 'loose', label: 'strict: false' },
              { value: 'safe', label: 'safeParse' },
            ]}
          />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-fg-muted">
          {outcome.ok && outcome.value ? (
            outcome.value.isValid ? (
              <p>
                <span className="font-mono text-fg">{outcome.value.date.toISOString()}</span>
                <br />
                {outcome.value.hasTimezone
                  ? 'The input carried its own offset, so defaultTimezone was not used.'
                  : `No offset in the input, so it was read as wall time in ${zone}, never in your machine's zone.`}
              </p>
            ) : (
              <p>Not a date clockworktz will guess at: isValid is false, nothing thrown.</p>
            )
          ) : (
            <p>Strict parsing refuses this input and throws, rather than guessing.</p>
          )}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-end gap-3">
          <TextInput label="parseOffset" value={offset} onChange={setOffset} invalid={!offsetResult.ok} />
          <p className="pb-2 font-mono text-sm">
            {offsetResult.ok ? (
              <>
                {inspect(offsetResult.value)} <span className="text-fg-muted">minutes</span>
              </>
            ) : (
              <span className="text-danger">{offsetResult.error.name}</span>
            )}
          </p>
        </div>
      </div>
      <LiveCode code={code} outcome={outcome} title="parse.ts" />
    </div>
  )
}
