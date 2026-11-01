import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocPage } from '@/components/docs/doc-page'
import { getDoc } from '@/lib/docs'

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getDoc('')
  return {
    title: 'Documentation',
    description: doc?.description,
    alternates: { canonical: '/docs' },
  }
}

export default async function DocsIndex() {
  const doc = await getDoc('')
  if (!doc) {
    notFound()
  }
  return <DocPage doc={doc} />
}
