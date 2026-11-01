import Link from 'next/link'
import { Logo } from './logo'
import { HeaderNav, HeaderSection } from './header-nav'
import { GitHubIcon, NpmIcon } from './icons'
import { MobileMenu } from './mobile-menu'
import { ThemeToggle } from './theme-toggle'
import { site } from '@/lib/site'

export function SiteHeader() {
  return (
    <header data-sticky className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 lg:gap-4 sm:px-6">
        <Link href="/" aria-label="clockworktz home">
          <Logo />
        </Link>
        <HeaderSection />
        <HeaderNav />
        <div className="ml-auto hidden items-center gap-1.5 lg:flex">
          <a href={site.npm} aria-label="clockworktz on npm" className="grid size-8 place-items-center rounded-full text-fg-muted hover:text-fg">
            <NpmIcon className="size-4" />
          </a>
          <a href={site.repo} aria-label="clockworktz on GitHub" className="grid size-8 place-items-center rounded-full text-fg-muted hover:text-fg">
            <GitHubIcon className="size-4" />
          </a>
          <ThemeToggle />
        </div>
        {/* Below lg: the logo and a slide-in menu */}
        <div className="ml-auto lg:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
