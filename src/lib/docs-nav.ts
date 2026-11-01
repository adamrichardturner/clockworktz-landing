// Docs navigation, kept free of server-only imports so client components can use it

export interface DocLink {
  slug: string
  title: string
}

export interface DocGroup {
  title: string
  items: DocLink[]
}

export const docsNav: DocGroup[] = [
  {
    title: 'Getting started',
    items: [
      { slug: '', title: 'Introduction' },
      { slug: 'getting-started', title: 'Installation & quick start' },
      { slug: 'core-concepts', title: 'Core concepts' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { slug: 'dst-disambiguation', title: 'DST gaps & overlaps' },
      { slug: 'engines', title: 'Engines & tzdb data' },
      { slug: 'formatting', title: 'Formatting' },
      { slug: 'parsing', title: 'Parsing' },
      { slug: 'transitions', title: 'Transitions & clocks' },
      { slug: 'time-zone-lists', title: 'Zone lists & countries' },
      { slug: 'errors', title: 'Errors' },
      { slug: 'recipes', title: 'Recipes' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { slug: 'api', title: 'API reference' },
      { slug: 'unusual-zones', title: 'Unusual zones' },
      { slug: 'security', title: 'Security & signing' },
      { slug: 'faq', title: 'FAQ' },
    ],
  },
]

export const docSlugs = docsNav.flatMap(group => group.items.map(item => item.slug))

export function docHref(slug: string): string {
  return slug ? `/docs/${slug}` : '/docs'
}

export function getAdjacentDocs(slug: string): { prev?: DocLink; next?: DocLink } {
  const flat = docsNav.flatMap(group => group.items)
  const index = flat.findIndex(item => item.slug === slug)
  return { prev: flat[index - 1], next: flat[index + 1] }
}
