import { ogContentType, ogSize, renderDocOg } from '@/lib/og'

export const alt = 'clockworktz live demo'
export const size = ogSize
export const contentType = ogContentType

export default async function Image() {
  return renderDocOg({
    section: 'Demo',
    eyebrow: 'Live demo',
    title: 'clockworktz, running in your browser',
    description: 'World clocks, conversions, DST gaps and overlaps, transitions, formatting, parsing, engines and signed tzdb updates.',
    url: 'clockworktz.dev/demo',
    cta: 'Try it →',
  })
}
