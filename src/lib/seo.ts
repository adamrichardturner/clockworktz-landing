import type { Metadata } from 'next'
import { site } from './site'

export const keywords = [
  'clockworktz',
  'clockworktz npm',
  'timezone library',
  'javascript timezone',
  'typescript timezone',
  'node timezone',
  'time zone conversion',
  'convert timezone javascript',
  'DST',
  'daylight saving time',
  'DST disambiguation',
  'IANA time zone database',
  'tzdb',
  'Intl.DateTimeFormat',
  'Temporal',
  'date formatting',
  'zero dependencies',
]

/**
 * Open Graph and Twitter tags for a page. Next.js replaces (doesn't merge) a
 * parent's `openGraph` and `twitter` objects, so every page sets them in full.
 * Images come from the opengraph-image / twitter-image file conventions.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = 'website',
}: {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
}): Metadata {
  return {
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      siteName: 'clockworktz',
      locale: 'en_GB',
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export function jsonLd(data: object): { __html: string } {
  // Escape "<" so the JSON can't close the script tag
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') }
}

export const author = {
  '@type': 'Person',
  name: site.author,
  url: 'https://adamrichardturner.dev',
} as const
