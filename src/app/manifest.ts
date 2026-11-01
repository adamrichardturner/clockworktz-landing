import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'clockwork-tz',
    short_name: 'clockwork-tz',
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0c0b',
    theme_color: '#0d0c0b',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
