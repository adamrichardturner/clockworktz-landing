'use client'

import { useState } from 'react'
import { CopyButton } from '../copy-button'

export interface CodeTab {
  id: string
  label: string
  file: string
  code: string
  html: string
}

export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const [active, setActive] = useState(tabs[0]!.id)
  const tab = tabs.find(t => t.id === active)!
  return (
    <div className="code-block min-w-0 overflow-hidden rounded-2xl border border-border bg-code-bg shadow-sm">
      <div role="tablist" aria-label="Examples" className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 pt-2 [scrollbar-width:none]">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={t.id === active}
            aria-controls={`panel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={`-mb-px shrink-0 rounded-t-lg border border-b-0 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm ${
              t.id === active
                ? 'border-border bg-code-bg text-fg'
                : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between py-1 pr-1 pl-4">
        <span className="font-mono text-xs text-fg-faint">{tab.file}</span>
        <CopyButton text={tab.code} />
      </div>
      <div
        role="tabpanel"
        id={`panel-${tab.id}`}
        aria-labelledby={`tab-${tab.id}`}
        className="max-h-[30rem] overflow-y-auto"
        dangerouslySetInnerHTML={{ __html: tab.html }}
      />
    </div>
  )
}
