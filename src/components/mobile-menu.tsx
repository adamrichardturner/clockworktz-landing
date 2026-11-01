'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useSyncExternalStore } from 'react'
import {
  AlarmClock,
  ArrowLeftRight,
  BookOpen,
  Braces,
  CalendarClock,
  ChefHat,
  Clock,
  Code,
  Cpu,
  FileText,
  FlaskConical,
  Globe2,
  House,
  ListChecks,
  Menu,
  Play,
  ScanText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Type,
  X,
  type LucideIcon,
} from 'lucide-react'
import { GitHubIcon, NpmIcon } from './icons'
import { LogoMark } from './logo'
import { ThemeToggle } from './theme-toggle'
import { buttonVariants } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { docHref, docsNav } from '@/lib/docs-nav'
import { currentSection } from '@/lib/nav'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'

interface MenuLink {
  readonly href: string
  readonly label: string
  readonly detail: string
  readonly icon: LucideIcon
}

const homeSections: readonly MenuLink[] = [
  { href: '#clocks', label: 'Weird zones, live', detail: 'Eight offsets that break naive code', icon: Clock },
  { href: '#dst', label: 'Gaps & overlaps', detail: 'Times that never happen, or twice', icon: ArrowLeftRight },
  { href: '#features', label: 'Why clockworktz', detail: 'Small, strict and exact', icon: Sparkles },
  { href: '#examples', label: 'Examples', detail: 'Convert, format, transitions', icon: Code },
  { href: '#engines', label: 'Engines', detail: 'Intl data, or a pinned tzdb', icon: Cpu },
  { href: '#tested', label: 'Tested zones', detail: 'Every strange case, covered', icon: ListChecks },
]

const demoSections: readonly MenuLink[] = [
  { href: '#clocks', label: 'Clocks', detail: 'onTick, format, getZoneInfo', icon: AlarmClock },
  { href: '#convert', label: 'Convert', detail: 'Wall time between zones', icon: ArrowLeftRight },
  { href: '#dst', label: 'DST lab', detail: 'Gaps, overlaps, strategies', icon: FlaskConical },
  { href: '#transitions', label: 'Transitions', detail: 'Every offset change in a year', icon: CalendarClock },
  { href: '#format', label: 'Format', detail: 'Tokens, locales, patterns', icon: Type },
  { href: '#parse', label: 'Parse', detail: 'Strict ISO 8601', icon: ScanText },
  { href: '#zones', label: 'Zones', detail: 'Offsets and countries', icon: Globe2 },
  { href: '#engines', label: 'Engines', detail: 'Signed tzdb updates', icon: ShieldCheck },
  { href: '#errors', label: 'Errors', detail: 'One class to catch', icon: TriangleAlert },
]

const exploreLinks: readonly MenuLink[] = [
  { href: '/', label: 'Home', detail: 'What clockworktz does', icon: House },
  { href: '/docs', label: 'Documentation', detail: 'Guides, from install to engines', icon: BookOpen },
  { href: '/demo', label: 'Live demo', detail: 'Every feature, in your browser', icon: Play },
  { href: '/docs/api', label: 'API reference', detail: 'Every export, with types', icon: Braces },
  { href: '/docs/recipes', label: 'Recipes', detail: 'Patterns for real apps', icon: ChefHat },
]

const subscribeHash = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}
const readHash = () => window.location.hash.replace(/^#/, '')
const readServerHash = () => ''

const itemClass = (current: boolean) =>
  cn(
    'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
    current ? 'bg-foreground text-background' : 'hover:bg-muted active:bg-muted'
  )

/** Scroll below the sticky header (and the demo's section bar) */
function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const sticky = [...document.querySelectorAll<HTMLElement>('[data-sticky]')].reduce((sum, el) => sum + el.getBoundingClientRect().height, 0)
  const top = target.getBoundingClientRect().top + window.scrollY - sticky - 16
  window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' })
}

function publishHash(id: string) {
  if (window.location.hash === `#${id}`) return
  window.history.replaceState(null, '', `#${id}`)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

function MenuLabel({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="px-3 font-mono text-xs tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

function ItemIcon({ icon: Icon, current }: { icon: LucideIcon; current: boolean }) {
  return (
    <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', current ? 'bg-background/15' : 'bg-muted text-accent')}>
      <Icon className="size-4" aria-hidden />
    </span>
  )
}

function ItemText({ label, detail, current, number }: { label: string; detail: string; current: boolean; number?: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="flex items-baseline gap-2">
        {number && <span className={cn('font-mono text-[11px]', current ? 'text-background/60' : 'text-muted-foreground')}>{number}</span>}
        <span className="text-base leading-none font-semibold tracking-tight">{label}</span>
      </span>
      <span className={cn('mt-1 block text-xs leading-relaxed', current ? 'text-background/70' : 'text-muted-foreground')}>{detail}</span>
    </span>
  )
}

export function MobileMenu() {
  const pathname = usePathname()
  const hash = useSyncExternalStore(subscribeHash, readHash, readServerHash)
  const pendingSection = useRef<string | null>(null)
  const [open, setOpen] = useState(false)

  const closeMenu = () => {
    pendingSection.current = null
    setOpen(false)
  }

  // Scroll once the sheet has finished sliding away, so the motion doesn't fight
  const onOpenChangeComplete = (nextOpen: boolean) => {
    if (nextOpen) return
    const id = pendingSection.current
    pendingSection.current = null
    if (id === null) return
    publishHash(id)
    scrollToSection(id)
  }

  const onDocs = pathname === '/docs' || pathname.startsWith('/docs/')
  const sections = pathname === '/' ? homeSections : pathname === '/demo' ? demoSections : null
  const section = currentSection(pathname)

  return (
    <Sheet
      open={open}
      onOpenChange={next => {
        if (next) pendingSection.current = null
        setOpen(next)
      }}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <SheetTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-10 shrink-0 lg:hidden')} aria-label="Open menu">
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton={false}
        finalFocus={() => pendingSection.current === null}
        className={cn(
          'grid h-full max-h-dvh min-h-0 w-[min(88vw,22.5rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden bg-background p-0 text-foreground shadow-2xl duration-300 ease-out sm:max-w-none',
          'data-[side=left]:data-ending-style:translate-x-[-100%]! data-[side=left]:data-starting-style:translate-x-[-100%]!'
        )}
      >
        <SheetHeader className="gap-3 border-b border-border px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-3">
              <LogoMark className="size-8" />
              <SheetTitle className="font-mono text-2xl leading-tight font-semibold tracking-tight text-foreground">clockworktz</SheetTitle>
            </div>
            <SheetClose aria-label="Close menu" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), '-mt-1 -mr-1 shrink-0')}>
              <X />
            </SheetClose>
          </div>
          <SheetDescription className="text-sm leading-relaxed">
            Timezones that get the weird zones right. Zero dependencies, v{site.version}.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-col gap-6 overflow-y-auto overscroll-contain px-3 py-4">
          {sections && (
            <nav aria-labelledby="mobile-menu-page">
              <MenuLabel id="mobile-menu-page">On this page</MenuLabel>
              <ul className="mt-2 space-y-1">
                {sections.map((link, index) => {
                  const current = hash === link.href.slice(1)
                  return (
                    <li key={link.href}>
                      <button
                        type="button"
                        className={itemClass(current)}
                        aria-current={current ? 'location' : undefined}
                        onClick={() => {
                          pendingSection.current = link.href.slice(1)
                          setOpen(false)
                        }}
                      >
                        <ItemIcon icon={link.icon} current={current} />
                        <ItemText label={link.label} detail={link.detail} current={current} number={String(index + 1).padStart(2, '0')} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          )}

          {onDocs &&
            docsNav.map(group => (
              <nav key={group.title} aria-labelledby={`mobile-menu-${group.title}`}>
                <MenuLabel id={`mobile-menu-${group.title}`}>{group.title}</MenuLabel>
                <ul className="mt-2 space-y-0.5">
                  {group.items.map(item => {
                    const href = docHref(item.slug)
                    const current = pathname === href
                    return (
                      <li key={href}>
                        <Link href={href} onClick={closeMenu} aria-current={current ? 'page' : undefined} className={cn(itemClass(current), 'py-2')}>
                          <FileText className={cn('size-4 shrink-0', current ? 'text-background/70' : 'text-muted-foreground')} aria-hidden />
                          <span className="text-sm font-medium">{item.title}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            ))}

          <nav aria-labelledby="mobile-menu-explore">
            <MenuLabel id="mobile-menu-explore">Explore</MenuLabel>
            <ul className="mt-2 space-y-1">
              {exploreLinks.map(link => {
                const current = section === link.href
                return (
                  <li key={link.href}>
                    <Link href={link.href} onClick={closeMenu} aria-current={current ? 'page' : undefined} className={itemClass(current)}>
                      <ItemIcon icon={link.icon} current={current} />
                      <ItemText label={link.label} detail={link.detail} current={current} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        <SheetFooter className="mt-0 gap-3 border-t border-border p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-sm text-muted-foreground">Appearance</p>
            <ThemeToggle />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a href={site.repo} className={cn(buttonVariants({ variant: 'default' }), 'h-10 w-full')}>
              <GitHubIcon className="size-4" /> GitHub
            </a>
            <a href={site.npm} className={cn(buttonVariants({ variant: 'outline' }), 'h-10 w-full')}>
              <NpmIcon className="size-4" /> npm
            </a>
          </div>
          <nav aria-label="More" className="flex gap-4 px-1 text-sm text-muted-foreground">
            <a href={`${site.repo}/blob/main/CHANGELOG.md`} className="underline-offset-4 hover:text-foreground hover:underline">
              Changelog
            </a>
            <Link href="/docs/security" onClick={closeMenu} className="underline-offset-4 hover:text-foreground hover:underline">
              Security
            </Link>
          </nav>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
