import { ogContentType, ogSize, renderHomeOg } from '@/lib/og'

export const alt = 'clockworktz: timezones that get the weird zones right'
export const size = ogSize
export const contentType = ogContentType

export default function Image() {
  return renderHomeOg()
}
