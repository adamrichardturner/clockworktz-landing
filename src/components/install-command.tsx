'use client'

import { useState } from 'react'
import { CopyButton } from './copy-button'

const managers = {
  npm: 'npm install clockwork-tz',
  pnpm: 'pnpm add clockwork-tz',
  yarn: 'yarn add clockwork-tz',
  bun: 'bun add clockwork-tz',
} as const

type Manager = keyof typeof managers

export function InstallCommand() {
  const [manager, setManager] = useState<Manager>('npm')
  const command = managers[manager]
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-sm">
      <div role="tablist" aria-label="Package manager" className="flex gap-1 border-b border-border px-2 pt-1.5">
        {(Object.keys(managers) as Manager[]).map(name => (
          <button
            key={name}
            role="tab"
            type="button"
            aria-selected={manager === name}
            onClick={() => setManager(name)}
            className={`-mb-px border-b-2 px-2.5 pb-1.5 font-mono text-xs transition-colors ${
              manager === name ? 'border-accent text-fg' : 'border-transparent text-fg-faint hover:text-fg'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 py-1.5 pr-1.5 pl-4">
        <span className="font-mono text-sm text-fg-faint select-none">$</span>
        <code className="flex-1 overflow-x-auto font-mono text-sm whitespace-nowrap">{command}</code>
        <CopyButton text={command} />
      </div>
    </div>
  )
}
