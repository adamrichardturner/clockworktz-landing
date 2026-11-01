'use client'

import { useState } from 'react'

type Option = 'compatible' | 'earliest' | 'latest' | 'reject'

interface Outcome {
  utc?: string
  local?: string
  abbreviation?: string
  error?: string
}

interface Scenario {
  id: string
  label: string
  kind: 'gap' | 'overlap'
  wall: string
  zone: string
  story: string
  /** Strip: [before, the gap or overlap, after] wall-clock labels */
  strip: [string, string, string]
  outcomes: Record<Option, Outcome>
}

// Every outcome below is the real output of clockwork-tz 1.0.0
const scenarios: Scenario[] = [
  {
    id: 'ny-spring',
    label: 'New York, spring forward',
    kind: 'gap',
    wall: '2024-03-10T02:30:00',
    zone: 'America/New_York',
    story: 'Clocks jump from 02:00 EST to 03:00 EDT, so 02:30 never happens.',
    strip: ['01:59 EST', '02:00 – 02:59 skipped', '03:00 EDT'],
    outcomes: {
      compatible: { utc: '2024-03-10T07:30:00.000Z', local: '2024-03-10 03:30:00.000', abbreviation: 'EDT' },
      earliest: { utc: '2024-03-10T06:30:00.000Z', local: '2024-03-10 01:30:00.000', abbreviation: 'EST' },
      latest: { utc: '2024-03-10T07:30:00.000Z', local: '2024-03-10 03:30:00.000', abbreviation: 'EDT' },
      reject: { error: 'InvalidTimeError' },
    },
  },
  {
    id: 'ny-fall',
    label: 'New York, fall back',
    kind: 'overlap',
    wall: '2024-11-03T01:30:00',
    zone: 'America/New_York',
    story: 'Clocks go back from 02:00 EDT to 01:00 EST, so 01:30 happens twice.',
    strip: ['00:59 EDT', '01:00 – 01:59 twice', '02:00 EST'],
    outcomes: {
      compatible: { utc: '2024-11-03T05:30:00.000Z', local: '2024-11-03 01:30:00.000', abbreviation: 'EDT' },
      earliest: { utc: '2024-11-03T05:30:00.000Z', local: '2024-11-03 01:30:00.000', abbreviation: 'EDT' },
      latest: { utc: '2024-11-03T06:30:00.000Z', local: '2024-11-03 01:30:00.000', abbreviation: 'EST' },
      reject: { error: 'AmbiguousTimeError' },
    },
  },
  {
    id: 'lord-howe',
    label: 'Lord Howe, 30-minute DST',
    kind: 'gap',
    wall: '2024-10-06T02:15:00',
    zone: 'Australia/Lord_Howe',
    story: 'Lord Howe Island only moves its clocks by half an hour: 02:00 becomes 02:30.',
    strip: ['01:59 +1030', '02:00 – 02:29 skipped', '02:30 +11'],
    outcomes: {
      compatible: { utc: '2024-10-05T15:45:00.000Z', local: '2024-10-06 02:45:00.000', abbreviation: '+11' },
      earliest: { utc: '2024-10-05T15:15:00.000Z', local: '2024-10-06 01:45:00.000', abbreviation: '+1030' },
      latest: { utc: '2024-10-05T15:45:00.000Z', local: '2024-10-06 02:45:00.000', abbreviation: '+11' },
      reject: { error: 'InvalidTimeError' },
    },
  },
  {
    id: 'samoa',
    label: 'Samoa, the missing day',
    kind: 'gap',
    wall: '2011-12-30T12:00:00',
    zone: 'Pacific/Apia',
    story: 'Samoa crossed the date line in 2011: Thursday 29 December was followed by Saturday 31.',
    strip: ['29 Dec, −10', '30 Dec skipped', '31 Dec, +14'],
    outcomes: {
      compatible: { utc: '2011-12-30T22:00:00.000Z', local: '2011-12-31 12:00:00.000', abbreviation: '+14' },
      earliest: { utc: '2011-12-29T22:00:00.000Z', local: '2011-12-29 12:00:00.000', abbreviation: '-10' },
      latest: { utc: '2011-12-30T22:00:00.000Z', local: '2011-12-31 12:00:00.000', abbreviation: '+14' },
      reject: { error: 'InvalidTimeError' },
    },
  },
]

const options: { value: Option; hint: string }[] = [
  { value: 'compatible', hint: 'default' },
  { value: 'earliest', hint: '' },
  { value: 'latest', hint: '' },
  { value: 'reject', hint: 'throws' },
]

export function DstExplorer() {
  const [scenarioId, setScenarioId] = useState(scenarios[0]!.id)
  const [option, setOption] = useState<Option>('compatible')
  const scenario = scenarios.find(s => s.id === scenarioId)!
  const outcome = scenario.outcomes[option]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Scenario">
        {scenarios.map(s => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={s.id === scenarioId}
            onClick={() => setScenarioId(s.id)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              s.id === scenarioId
                ? 'border-accent bg-accent-soft'
                : 'border-border bg-surface hover:border-border-strong'
            }`}
          >
            <span className="block text-sm font-medium">{s.label}</span>
            <span className="block font-mono text-xs text-fg-muted">
              {s.kind === 'gap' ? 'Gap: time is skipped' : 'Overlap: time repeats'}
            </span>
          </button>
        ))}
      </div>

      <div className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <p className="text-sm text-fg-muted">{scenario.story}</p>

        <div className="mt-4 grid grid-cols-[1fr_1.4fr_1fr] overflow-hidden rounded-lg border border-border font-mono text-[0.7rem] sm:text-xs">
          <div className="bg-bg-subtle px-2 py-2 text-center text-fg-muted">{scenario.strip[0]}</div>
          <div
            className={`px-2 py-2 text-center font-medium ${
              scenario.kind === 'gap'
                ? 'bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--border)_6px_8px)] text-fg'
                : 'bg-accent-soft text-accent'
            }`}
          >
            {scenario.strip[1]}
          </div>
          <div className="bg-bg-subtle px-2 py-2 text-center text-fg-muted">{scenario.strip[2]}</div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Disambiguation">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={o.value === option}
              onClick={() => setOption(o.value)}
              className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                o.value === option
                  ? 'border-accent bg-accent text-accent-fg'
                  : 'border-border text-fg-muted hover:border-border-strong hover:text-fg'
              }`}
            >
              {o.value}
              {o.hint && <span className="opacity-70"> · {o.hint}</span>}
            </button>
          ))}
        </div>

        <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-code-bg p-4 font-mono text-[0.8rem] leading-relaxed">
          <code>
            <span className="text-fg-muted">interpretLocal(</span>
            <span className="text-[#0a3069] dark:text-[#a5d6ff]">&apos;{scenario.wall}&apos;</span>
            <span className="text-fg-muted">, </span>
            <span className="text-[#0a3069] dark:text-[#a5d6ff]">&apos;{scenario.zone}&apos;</span>
            <span className="text-fg-muted">{', {\n  disambiguation: '}</span>
            <span className="text-[#0a3069] dark:text-[#a5d6ff]">&apos;{option}&apos;</span>
            <span className="text-fg-muted">{',\n})'}</span>
            {'\n'}
            {outcome.error ? (
              <span className="text-[#cf222e] dark:text-[#ff7b72]">{`// throws ${outcome.error}`}</span>
            ) : (
              <span className="text-[#6e7781] dark:text-[#8b949e]">
                {`// utc:   '${outcome.utc}'\n// local: '${outcome.local}' (${outcome.abbreviation})`}
              </span>
            )}
          </code>
        </pre>
      </div>
    </div>
  )
}
