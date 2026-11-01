import type { MetadataRoute } from 'next'
import { docHref, docSlugs } from '@/lib/docs'
import { site } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, priority: 1 },
    { url: `${site.url}/demo`, priority: 0.9 },
    ...docSlugs.map(slug => ({ url: `${site.url}${docHref(slug)}`, priority: slug ? 0.7 : 0.9 })),
  ]
}
