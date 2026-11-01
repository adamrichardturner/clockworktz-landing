export const mainNav = [
  { href: '/docs', label: 'Docs' },
  { href: '/demo', label: 'Demo' },
  { href: '/docs/api', label: 'API' },
  { href: '/docs/recipes', label: 'Recipes' },
] as const

export type MainNavHref = (typeof mainNav)[number]['href'] | '/'

/** The top-level section a path belongs to: API and Recipes win over Docs */
export function currentSection(pathname: string): MainNavHref {
  if (pathname === '/docs/api' || pathname === '/docs/recipes' || pathname === '/demo') return pathname
  if (pathname === '/docs' || pathname.startsWith('/docs/')) return '/docs'
  return '/'
}
