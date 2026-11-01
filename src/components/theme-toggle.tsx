'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

const options = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'dark', label: 'Dark', Icon: Moon },
] as const

const subscribe = () => () => {}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  // The stored theme is only known on the client
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)

  return (
    <div role="radiogroup" aria-label="Color theme" className="flex rounded-full border border-border p-0.5">
      {options.map(({ value, label, Icon }) => {
        const active = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`grid size-7 place-items-center rounded-full transition-colors ${
              active ? 'bg-bg-subtle text-fg' : 'text-fg-faint hover:text-fg'
            }`}
          >
            <Icon className="size-3.5" />
          </button>
        )
      })}
    </div>
  )
}
