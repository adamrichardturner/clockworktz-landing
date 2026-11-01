import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocPage } from '@/components/docs/doc-page'
import { docSlugs, getDoc } from '@/lib/docs'

export function generateStaticParams() {
  return docSlugs.filter(Boolean).map(slug => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<'/docs/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const doc = await getDoc(slug)
  if (!doc) {
    return {}
  }
  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: `/docs/${slug}` },
    openGraph: { title: `${doc.title} · clockwork-tz`, description: doc.description },
  }
}

export default async function DocsSlugPage({ params }: PageProps<'/docs/[slug]'>) {
  const { slug } = await params
  const doc = await getDoc(slug)
  if (!doc) {
    notFound()
  }
  return <DocPage doc={doc} />
}
