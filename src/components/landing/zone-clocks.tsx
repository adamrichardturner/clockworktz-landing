'use client'

import { useEffect, useState } from 'react'

/**
 * Live clocks for zones that break naive timezone code. This page uses the
 * browser's Intl data directly, the same source as clockwork-tz's default
 * system-intl engine.
 */
const zones = [
  { zone: 'Australia/Lord_Howe', note: '30-minute DST' },
  { zone: 'Pacific/Chatham', note: '+12:45 / +13:45' },
  { zone: 'Asia/Kathmandu', note: '+05:45 all year' },
  { zone: 'Australia/Eucla', note: 'Unofficial +08:45' },
  { zone: 'Pacific/Marquesas', note: '−09:30' },
  { zone: 'Pacific/Kiritimati', note: 'UTC+14, a day ahead' },
  { zone: 'America/St_Johns', note: 'Half-hour, with DST' },
  { zone: 'Antarctica/Troll', note: 'Two-hour DST' },
]

function offsetLabel(date: Date, zone: string): string {
  const name =
    new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'longOffset' })
      .formatToParts(date)
      .find(part => part.type === 'timeZoneName')?.value ?? ''
  return name === 'GMT' ? 'UTC+00:00' : name.replace('GMT', 'UTC')
}

export function ZoneClocks() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    // Tick on whole seconds, like clockwork-tz's onTick, so clocks never drift
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      setNow(new Date())
      timer = setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    tick()
    return () => clearTimeout(timer)
  }, [])

  return (
    <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border min-[440px]:grid-cols-2 lg:grid-cols-4">
      {zones.map(({ zone, note }) => {
        const time = now
          ? new Intl.DateTimeFormat('en-GB', {
              timeZone: zone,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hourCycle: 'h23',
            }).format(now)
          : '--:--:--'
        const day = now
          ? new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short' }).format(now)
          : ' '
        return (
          <li key={zone} className="flex flex-col gap-1 bg-surface p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-mono text-xs text-fg-muted">{zone}</span>
              <span className="shrink-0 font-mono text-[0.7rem] text-accent">{now ? offsetLabel(now, zone) : ''}</span>
            </div>
            <time className="font-mono text-2xl font-medium tabular-nums tracking-tight" suppressHydrationWarning>
              {time}
            </time>
            <div className="flex justify-between gap-2 text-xs text-fg-faint">
              <span>{day}</span>
              <span className="text-right">{note}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
