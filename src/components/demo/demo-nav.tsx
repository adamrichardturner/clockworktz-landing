'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useEngine } from './engine-context'

/** Sticky jump links, highlighting the section in view, plus the active engine */
export function DemoNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id)
  const { engine, setEngine, switching } = useEngine()

  useEffect(() => {
    // Observers only report sections whose visibility changed, so keep the full set
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const first = sections.find(s => visible.has(s.id))
        if (first) setActive(first.id)
      },
      { rootMargin: '-120px 0px -60% 0px' }
    )
    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  useEffect(() => {
    document.querySelector(`nav[aria-label="Demo sections"] a[href="#${active}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [active])

  return (
    <div className="sticky top-14 z-30 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6">
        <nav aria-label="Demo sections" className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={active === s.id ? 'true' : undefined}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                active === s.id ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          disabled={switching}
          onClick={() => setEngine(engine === 'system-intl' ? 'embedded-tzdb' : 'system-intl')}
          title="Switch the engine every demo uses"
          className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[0.7rem] text-fg-muted hover:border-accent hover:text-fg sm:inline-flex"
        >
          {switching ? <Loader2 className="size-3 animate-spin" /> : <span className="size-1.5 rounded-full bg-accent" />}
          {engine}
        </button>
      </div>
    </div>
  )
}
