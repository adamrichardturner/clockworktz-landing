import { docSlugs, docsNav, getDoc } from '@/lib/docs'
import { ogContentType, ogSize, renderDocOg } from '@/lib/og'

export const alt = 'clockworktz documentation page'
export const size = ogSize
export const contentType = ogContentType

export function generateStaticParams() {
  return docSlugs.filter(Boolean).map(slug => ({ slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = await getDoc(slug)
  const section = docsNav.find(group => group.items.some(item => item.slug === slug))?.title ?? 'Docs'
  return renderDocOg({
    section,
    title: doc?.title ?? 'Documentation',
    description: doc?.description ?? '',
    url: `clockworktz.dev/docs/${slug}`,
  })
}
