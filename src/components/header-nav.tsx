'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { currentSection, mainNav } from '@/lib/nav'
import { cn } from '@/lib/utils'

/** Desktop nav: the current section is bold, full-contrast and underlined in the accent */
export function HeaderNav() {
  const section = currentSection(usePathname())
  return (
    <nav aria-label="Main" className="ml-2 hidden items-stretch self-stretch gap-5 text-sm lg:flex">
      {mainNav.map(item => {
        const current = section === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? 'page' : undefined}
            className={cn('relative flex items-center transition-colors', current ? 'font-medium text-fg' : 'text-fg-muted hover:text-fg')}
          >
            {item.label}
            {current && (
              <motion.span
                layoutId="header-nav-indicator"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

/** Below lg the nav lives in the menu, so name the current section beside the logo */
export function HeaderSection() {
  const section = currentSection(usePathname())
  const item = mainNav.find(entry => entry.href === section)
  if (!item) return null
  return (
    <span className="flex items-center gap-2 text-sm lg:hidden">
      <span className="text-fg-faint">/</span>
      <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-medium text-accent">{item.label}</span>
    </span>
  )
}
