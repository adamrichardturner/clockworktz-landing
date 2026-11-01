'use client'

import { useEffect, useState } from 'react'

/**
 * The rendered width of a chart's container, so the SVG can be drawn at one
 * unit per pixel: text stays the same size on phones and desktops. Returns a
 * callback ref, because charts mount after a skeleton, not on first render.
 */
export function useChartWidth(fallback = 560) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(280, Math.round(entry.contentRect.width)))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])
  return [setElement, width] as const
}
