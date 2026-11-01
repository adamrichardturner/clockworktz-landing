'use client'

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { initClockworkTZ, tzdbVersion, type EngineKind } from 'clockworktz'

interface EngineState {
  engine: EngineKind
  version: string | undefined
  switching: boolean
  /** Bumps whenever the engine changes, so demos recompute */
  rev: number
  setEngine: (engine: EngineKind) => Promise<void>
}

const EngineContext = createContext<EngineState | null>(null)

/** Loads the 30 kB tzdb snapshot only when the embedded engine is first chosen */
export async function loadTzdb() {
  const { tzdb } = await import('clockworktz/tzdb')
  return tzdb
}

/**
 * clockworktz keeps one active engine for the whole page. This provider owns
 * it, so every demo below switches together.
 */
export function EngineProvider({ children }: { children: React.ReactNode }) {
  const [engine, setEngineKind] = useState<EngineKind>('system-intl')
  const [version, setVersion] = useState<string>()
  const [switching, setSwitching] = useState(false)
  const [rev, setRev] = useState(0)

  const setEngine = useCallback(async (next: EngineKind) => {
    setSwitching(true)
    try {
      if (next === 'embedded-tzdb') {
        await initClockworkTZ({ engine: 'embedded-tzdb', data: await loadTzdb() })
      } else {
        await initClockworkTZ({ engine: 'system-intl' })
      }
      setEngineKind(next)
      setVersion(tzdbVersion())
      setRev(r => r + 1)
    } finally {
      setSwitching(false)
    }
  }, [])

  // Leave the library on its default engine when the page goes away
  useEffect(() => () => void initClockworkTZ({ engine: 'system-intl' }), [])

  return (
    <EngineContext.Provider value={{ engine, version, switching, rev, setEngine }}>{children}</EngineContext.Provider>
  )
}

export function useEngine(): EngineState {
  const value = useContext(EngineContext)
  if (!value) {
    throw new Error('useEngine must be used inside EngineProvider')
  }
  return value
}

const subscribe = () => () => {}

/** False during server rendering and hydration, true once running in the browser */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
