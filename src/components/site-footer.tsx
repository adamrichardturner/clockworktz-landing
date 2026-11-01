import Link from 'next/link'
import { LogoMark } from './logo'
import { site } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-fg-muted sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-2">
          <LogoMark className="size-5" />
          <span>
            MIT © {site.author} · v{site.version} · tzdb {site.tzdbVersion}
          </span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 sm:ml-auto">
          <Link href="/docs" className="hover:text-fg">
            Docs
          </Link>
          <Link href="/docs/security" className="hover:text-fg">
            Security
          </Link>
          <a href={`${site.repo}/blob/main/CHANGELOG.md`} className="hover:text-fg">
            Changelog
          </a>
          <a href={site.repo} className="hover:text-fg">
            GitHub
          </a>
          <a href={site.npm} className="hover:text-fg">
            npm
          </a>
        </nav>
      </div>
    </footer>
  )
}
