import { DocsSidebar } from '@/components/docs/docs-sidebar'
import { docsNav } from '@/lib/docs-nav'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl lg:flex lg:gap-8 lg:px-6">
      <DocsSidebar nav={docsNav} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
