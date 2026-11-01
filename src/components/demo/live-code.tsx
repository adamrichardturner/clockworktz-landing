'use client'

import { AnimatePresence, motion } from 'motion/react'
import { CopyButton } from '../copy-button'
import type { Outcome } from '@/lib/demo/inspect'
import { inspect } from '@/lib/demo/inspect'

// A small TypeScript tokenizer: enough for demo snippets, in GitHub's colors.
// Shiki is used for the static docs; it's too heavy to ship for live code.
const TOKEN =
  /(\/\/[^\n]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|\b(import|from|const|let|await|async|new|return|try|catch|if|else|true|false|null|undefined|export|function|for|of)\b|\b(\d{4}-\d{2}-\d{2}T[\d:.]+Z|\d[\d_.]*)\b|([A-Za-z_$][\w$]*)(?=\s*\()/g

const colorFor = ['--tok-comment', '--tok-string', '--tok-keyword', '--tok-number', '--tok-function']

export function Highlight({ code }: { code: string }) {
  const parts: React.ReactNode[] = []
  let last = 0
  for (const match of code.matchAll(TOKEN)) {
    const index = match.index ?? 0
    if (index > last) parts.push(code.slice(last, index))
    const group = match.slice(1).findIndex(Boolean)
    parts.push(
      <span key={index} style={{ color: `var(${colorFor[group]})` }}>
        {match[0]}
      </span>
    )
    last = index + match[0].length
  }
  parts.push(code.slice(last))
  return <>{parts}</>
}

/**
 * A code snippet and the value clockworktz actually returned for it. The
 * output animates whenever it changes.
 */
export function LiveCode({
  code,
  outcome,
  output,
  title = 'demo.ts',
  maxHeight = '22rem',
  animated = true,
}: {
  code: string
  outcome?: Outcome<unknown>
  output?: string
  title?: string
  maxHeight?: string
  /** Off for outputs that change every second, like clocks */
  animated?: boolean
}) {
  const text = output ?? (outcome ? (outcome.ok ? inspect(outcome.value) : '') : '')
  const error = outcome && !outcome.ok ? outcome.error : undefined
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-code-bg">
      <div className="flex items-center justify-between border-b border-border py-1 pr-1 pl-4">
        <span className="font-mono text-xs text-fg-faint">{title}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[0.8rem] leading-relaxed">
        <code>
          <Highlight code={code} />
        </code>
      </pre>
      <div className="border-t border-dashed border-border bg-bg-subtle/60 px-4 py-3" aria-live={animated ? 'polite' : 'off'}>
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[0.68rem] tracking-wider text-fg-faint uppercase">
          <span className={`size-1.5 rounded-full ${error ? 'bg-danger' : 'bg-success'}`} />
          {error ? 'Throws' : 'Output'}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.pre
            key={animated ? (error ? `${error.name}:${error.message}` : text) : 'static'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={`overflow-auto font-mono text-[0.8rem] leading-relaxed ${error ? 'break-words whitespace-pre-wrap' : ''}`}
            style={{ maxHeight }}
          >
            {error ? (
              <code>
                <span style={{ color: 'var(--danger)' }} className="font-semibold">
                  {error.name}
                </span>
                <span className="text-fg-muted">: {error.message}</span>
              </code>
            ) : (
              <code>
                <Highlight code={text} />
              </code>
            )}
          </motion.pre>
        </AnimatePresence>
      </div>
    </div>
  )
}
