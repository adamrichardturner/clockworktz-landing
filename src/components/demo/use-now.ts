'use client'

import { useEffect, useState } from 'react'
import { onTick } from 'clockworktz'

/** The current time, updated by clockworktz's drift-free onTick */
export function useNow(granularityMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => onTick(setNow, granularityMs), [granularityMs])
  return now
}
