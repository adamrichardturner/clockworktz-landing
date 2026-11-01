'use client'

import { useEffect, useState } from 'react'
import type { TocEntry } from '@/lib/docs'

export function DocToc({ toc }: { toc: TocEntry[] }) {
  const [active, setActive] = useState<string>()

  useEffect(() => {
    const headings = toc
      .map(entry => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => el !== null)
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          setActive(visible[0].target.id)
        }
      },
      { rootMargin: '-72px 0px -65% 0px' }
    )
    headings.forEach(h => observer.observe(h))
    return () => observer.disconnect()
  }, [toc])

  if (toc.length === 0) {
    return null
  }

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="font-semibold">On this page</p>
      <ul className="mt-3 flex flex-col gap-1.5 border-l border-border">
        {toc.map(entry => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className={`-ml-px block border-l py-0.5 transition-colors ${entry.depth === 3 ? 'pl-6' : 'pl-3'} ${
                active === entry.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
