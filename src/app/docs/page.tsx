import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocPage } from '@/components/docs/doc-page'
import { getDoc } from '@/lib/docs'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getDoc('')
  const title = 'Documentation'
  return {
    title,
    ...pageMetadata({ title: `clockwork-tz ${title.toLowerCase()}`, description: doc?.description ?? '', path: '/docs' }),
  }
}

export default async function DocsIndex() {
  const doc = await getDoc('')
  if (!doc) {
    notFound()
  }
  return <DocPage doc={doc} />
}
