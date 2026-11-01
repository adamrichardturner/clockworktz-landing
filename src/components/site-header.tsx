import Link from 'next/link'
import { Logo } from './logo'
import { GitHubIcon, NpmIcon } from './icons'
import { MobileMenu } from './mobile-menu'
import { ThemeToggle } from './theme-toggle'
import { site } from '@/lib/site'

export function SiteHeader() {
  return (
    <header data-sticky className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="clockworktz home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="ml-2 hidden items-center gap-5 text-sm text-fg-muted lg:flex">
          <Link href="/docs" className="hover:text-fg">
            Docs
          </Link>
          <Link href="/demo" className="hover:text-fg">
            Demo
          </Link>
          <Link href="/docs/api" className="hover:text-fg">
            API
          </Link>
          <Link href="/docs/recipes" className="hover:text-fg">
            Recipes
          </Link>
        </nav>
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
