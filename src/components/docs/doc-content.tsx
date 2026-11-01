'use client'

import { useEffect, useRef } from 'react'

const copyIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'
const checkIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'

/** Rendered Markdown, with a copy button added to every code block */
export function DocContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) {
      return
    }
    const buttons: HTMLButtonElement[] = []
    for (const pre of root.querySelectorAll('pre')) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'copy-btn'
      button.ariaLabel = 'Copy code'
      button.innerHTML = copyIcon
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(pre.querySelector('code')?.innerText ?? pre.innerText)
          button.innerHTML = checkIcon
          button.dataset.copied = ''
          setTimeout(() => {
            button.innerHTML = copyIcon
            delete button.dataset.copied
          }, 1500)
        } catch {
          // Clipboard unavailable: leave the button as it is
        }
      })
      pre.append(button)
      buttons.push(button)
    }
    return () => buttons.forEach(button => button.remove())
  }, [html])

  return <div ref={ref} className="prose" dangerouslySetInnerHTML={{ __html: html }} />
}
