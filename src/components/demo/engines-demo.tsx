'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Loader2, ShieldAlert, X } from 'lucide-react'
import {
  DEFAULT_MANIFEST_URL,
  compareTzdbVersions,
  createEmbeddedTzdbEngine,
  createSystemIntlEngine,
  ensureFreshTzdb,
  getCacheStats,
  getStatus,
  verifyManifestSignature,
  type TzEngine,
  type TzdbManifest,
} from 'clockworktz'
import { loadTzdb, useEngine, useMounted } from './engine-context'
import { DemoSkeleton } from './controls'
import { LiveCode } from './live-code'
import { attempt } from '@/lib/demo/inspect'

function offsetWithSeconds(seconds: number): string {
  const sign = seconds < 0 ? '-' : '+'
  const abs = Math.abs(seconds)
  const parts = [Math.floor(abs / 3600), Math.floor((abs % 3600) / 60), abs % 60].map(n => String(n).padStart(2, '0'))
  return `${sign}${parts[2] === '00' ? parts.slice(0, 2).join(':') : parts.join(':')}`
}

const rows: { label: string; run: (e: TzEngine) => string }[] = [
  { label: 'London, July: abbreviation', run: e => e.getZoneInfo(Date.UTC(2024, 6, 5, 9), 'Europe/London').abbreviation },
  { label: 'Caracas, May 2016: isDST', run: e => String(e.getZoneInfo(Date.UTC(2016, 4, 1, 12), 'America/Caracas').isDST) },
  { label: 'Amsterdam, 1850: offset', run: e => offsetWithSeconds(e.getZoneInfo(Date.UTC(1850, 0, 1), 'Europe/Amsterdam').offsetSeconds) },
  { label: 'Europe/Zurich: countries', run: e => (e.getCountryCodes?.('Europe/Zurich') ?? []).join(', ') || '—' },
  { label: 'Zones listed', run: e => String(e.listZoneIds().length) },
  { label: 'tzdb version', run: e => e.getVersion() ?? 'runtime ICU' },
]

function EngineComparison() {
  const { engine } = useEngine()
  const [engines, setEngines] = useState<{ intl: TzEngine; tzdb: TzEngine } | null>(null)
  useEffect(() => {
    let live = true
    loadTzdb().then(tzdb => live && setEngines({ intl: createSystemIntlEngine(), tzdb: createEmbeddedTzdbEngine(tzdb) }))
    return () => {
      live = false
    }
  }, [])

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-fg-muted">
            <th className="px-4 py-2.5 font-medium">Same question</th>
            {(['system-intl', 'embedded-tzdb'] as const).map(kind => (
              <th key={kind} className="px-4 py-2.5 font-mono font-medium">
                <span className={`inline-flex items-center gap-1.5 ${engine === kind ? 'text-accent' : ''}`}>
                  {engine === kind && <span className="size-1.5 rounded-full bg-accent" />}
                  {kind}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const a = engines ? row.run(engines.intl) : '…'
            const b = engines ? row.run(engines.tzdb) : '…'
            const differs = engines && a !== b
            return (
              <tr key={row.label} className="border-t border-border">
                <td className="px-4 py-2 text-fg-muted">{row.label}</td>
                {[a, b].map((value, i) => (
                  <td key={i} className={`px-4 py-2 font-mono text-xs ${differs ? 'text-fg' : 'text-fg-muted'}`}>
                    <span className={differs ? 'rounded bg-accent-soft px-1.5 py-0.5' : ''}>{value}</span>
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type StepState = 'idle' | 'running' | 'pass' | 'fail' | 'skip'
interface Step {
  title: string
  detail?: string
  state: StepState
}

const initialSteps = (): Step[] => [
  { title: 'Fetch the signed manifest from jsDelivr', state: 'idle' },
  { title: 'Verify its Ed25519 signature', state: 'idle' },
  { title: 'Download tzdb.json and check its SHA-256', state: 'idle' },
  { title: 'Only accept a newer version than the one loaded', state: 'idle' },
  { title: 'ensureFreshTzdb(): the whole flow, cached', state: 'idle' },
]

function StepIcon({ state }: { state: StepState }) {
  const base = 'grid size-7 shrink-0 place-items-center rounded-full border'
  if (state === 'running') return <span className={`${base} border-accent text-accent`}><Loader2 className="size-4 animate-spin" /></span>
  if (state === 'pass') return <span className={`${base} border-success bg-success text-white`}><Check className="size-4" /></span>
  if (state === 'fail') return <span className={`${base} border-danger bg-danger text-white`}><X className="size-4" /></span>
  return <span className={`${base} border-border text-fg-faint`} />
}

function SignedUpdate() {
  const { version } = useEngine()
  const [steps, setSteps] = useState<Step[]>(initialSteps)
  const [tamper, setTamper] = useState(false)
  const [running, setRunning] = useState(false)

  const update = (i: number, patch: Partial<Step>) => setSteps(list => list.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const pause = () => new Promise(r => setTimeout(r, 450))

  async function run() {
    setRunning(true)
    setSteps(initialSteps())
    const skipFrom = (i: number) => setSteps(list => list.map((s, j) => (j > i ? { ...s, state: 'skip', detail: 'Not reached: the update is rejected and current data is kept.' } : s)))
    try {
      update(0, { state: 'running' })
      const manifest = (await (await fetch(DEFAULT_MANIFEST_URL, { cache: 'no-cache' })).json()) as TzdbManifest
      if (tamper) manifest.version = '2099z'
      await pause()
      update(0, { state: 'pass', detail: `version ${manifest.version}${tamper ? ' (tampered: was claiming a newer release)' : ''}, key ${manifest.keyId}` })

      update(1, { state: 'running' })
      const verified = await verifyManifestSignature(manifest)
      await pause()
      if (!verified) {
        update(1, { state: 'fail', detail: tamper ? 'verifyManifestSignature() → false: the signature covers the version, so any edit breaks it.' : 'verifyManifestSignature() → false. This browser may not support Ed25519 in WebCrypto.' })
        skipFrom(1)
        return
      }
      update(1, { state: 'pass', detail: 'verifyManifestSignature() → true' })

      update(2, { state: 'running' })
      const bytes = await (await fetch(manifest.dataUrl)).arrayBuffer()
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('')
      await pause()
      const hashOk = digest === manifest.sha256
      update(2, { state: hashOk ? 'pass' : 'fail', detail: `${(bytes.byteLength / 1024).toFixed(0)} kB, sha256 ${digest.slice(0, 16)}… ${hashOk ? 'matches' : 'does not match'}` })
      if (!hashOk) return skipFrom(2)

      update(3, { state: 'running' })
      // With system-intl nothing is loaded yet, so compare against the bundled snapshot
      const current = version ?? (await loadTzdb()).version
      const order = compareTzdbVersions(manifest.version, current)
      await pause()
      update(3, {
        state: 'pass',
        detail: `compareTzdbVersions('${manifest.version}', '${current}') → ${order}: ${order > 0 ? 'newer, so it would be loaded' : 'not newer, so the loaded data is kept'}`,
      })

      update(4, { state: 'running' })
      const fresh = await ensureFreshTzdb()
      const stats = await getCacheStats()
      await pause()
      update(4, { state: fresh ? 'pass' : 'fail', detail: fresh ? `→ { version: '${fresh.version}' } · cached ${stats.dataCached ? `(${stats.dataVersion})` : 'no'}` : '→ null' })
    } catch (error) {
      setSteps(list => {
        const i = list.findIndex(s => s.state === 'running')
        return list.map((s, j) => (j === i ? { ...s, state: 'fail', detail: error instanceof Error ? error.message : String(error) } : s))
      })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {running && <Loader2 className="size-4 animate-spin" />} Run a signed update
        </button>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
          <input type="checkbox" checked={tamper} onChange={e => setTamper(e.target.checked)} className="size-4 accent-[var(--danger)]" />
          <ShieldAlert className="size-4" /> Tamper with the manifest
        </label>
      </div>
      <ol className="mt-5 flex flex-col">
        {steps.map((step, i) => (
          <li key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
            {i < steps.length - 1 && <span className="absolute top-7 bottom-0 left-3.5 w-px bg-border" aria-hidden="true" />}
            <StepIcon state={step.state} />
            <div className={`min-w-0 pt-0.5 ${step.state === 'skip' ? 'opacity-50' : ''}`}>
              <p className="text-sm font-medium">{step.title}</p>
              <AnimatePresence>
                {step.detail && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="font-mono text-xs break-words text-fg-muted">
                    {step.detail}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function EnginesDemo() {
  const mounted = useMounted()
  const { engine, setEngine, switching, rev } = useEngine()
  if (!mounted) return <DemoSkeleton height={480} />

  const code =
    engine === 'embedded-tzdb'
      ? `import { initClockworkTZ, getStatus } from 'clockworktz'
import { tzdb } from 'clockworktz/tzdb'

await initClockworkTZ({ engine: 'embedded-tzdb', data: tzdb })

getStatus()`
      : `import { initClockworkTZ, getStatus } from 'clockworktz'

// The default: no setup needed
await initClockworkTZ({ engine: 'system-intl' })

getStatus()`

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-fg-muted">Every demo on this page is using</span>
          <button
            type="button"
            disabled={switching}
            onClick={() => setEngine(engine === 'system-intl' ? 'embedded-tzdb' : 'system-intl')}
            className="inline-flex h-8 items-center gap-2 rounded-full border border-accent px-3 font-mono text-xs text-accent hover:bg-accent-soft disabled:opacity-50"
          >
            {switching && <Loader2 className="size-3.5 animate-spin" />}
            {engine} · switch
          </button>
        </div>
        <EngineComparison />
        <LiveCode key={rev} code={code} outcome={attempt(() => getStatus())} title="init.ts" />
      </div>
      <SignedUpdate />
    </div>
  )
}
