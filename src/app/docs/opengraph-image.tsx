import { getDoc } from '@/lib/docs'
import { ogContentType, ogSize, renderDocOg } from '@/lib/og'

export const alt = 'clockworktz documentation'
export const size = ogSize
export const contentType = ogContentType

export default async function Image() {
  const doc = await getDoc('')
  return renderDocOg({
    section: 'Getting started',
    title: 'Documentation',
    description: doc?.description ?? '',
    url: 'clockworktz.dev/docs',
  })
}
