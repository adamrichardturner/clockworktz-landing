'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { docHref, type DocGroup } from '@/lib/docs-nav'

function NavList({ nav, pathname, onNavigate }: { nav: DocGroup[]; pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      {nav.map(group => (
        <div key={group.title}>
          <p className="px-3 text-xs font-semibold tracking-wide text-fg-faint uppercase">{group.title}</p>
          <ul className="mt-2 flex flex-col">
            {group.items.map(item => {
              const href = docHref(item.slug)
              const active = pathname === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      active ? 'bg-accent-soft font-medium text-accent' : 'text-fg-muted hover:bg-bg-subtle hover:text-fg'
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function DocsSidebar({ nav }: { nav: DocGroup[] }) {
  const pathname = usePathname()
  // Below lg, the header's mobile menu lists every docs page
  return (
    <>
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto py-8 pr-4 lg:block">
        <NavList nav={nav} pathname={pathname} />
      </aside>
    </>
  )
}
