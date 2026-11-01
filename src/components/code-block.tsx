import type { BundledLanguage } from 'shiki'
import { highlight } from '@/lib/highlight'
import { CopyButton } from './copy-button'

export async function CodeBlock({
  code,
  lang = 'ts',
  title,
  className = '',
}: {
  code: string
  lang?: BundledLanguage
  title?: string
  className?: string
}) {
  const html = await highlight(code, lang)
  return (
    <div className={`code-block overflow-hidden rounded-xl border border-border bg-code-bg ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-border py-1 pr-1 pl-4">
          <span className="font-mono text-xs text-fg-muted">{title}</span>
          <CopyButton text={code.trim()} />
        </div>
      )}
      <div className="relative">
        {!title && <CopyButton text={code.trim()} className="absolute top-2 right-2" />}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}
