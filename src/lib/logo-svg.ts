/**
 * The gear-clock logo as an SVG string, for generated images (Open Graph,
 * icons). Keep in sync with LogoMark in src/components/logo.tsx.
 */
export function logoSvg({
  accent = '#f59e0b',
  face = '#0d0c0b',
  hand = '#ece8e1',
  background,
}: { accent?: string; face?: string; hand?: string; background?: string } = {}): string {
  const teeth = Array.from(
    { length: 12 },
    (_, i) => `<rect x="14.5" y="1" width="3" height="5" rx="1" transform="rotate(${i * 30} 16 16)"/>`
  ).join('')
  const bg = background ? `<rect width="32" height="32" fill="${background}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${bg}<g fill="${accent}">${teeth}<circle cx="16" cy="16" r="11"/></g><circle cx="16" cy="16" r="8.5" fill="${face}"/><path d="M16 10.5V16l3.6 2.4" fill="none" stroke="${hand}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="16" r="1.4" fill="${hand}"/></svg>`
}

export function logoDataUri(options?: Parameters<typeof logoSvg>[0]): string {
  return `data:image/svg+xml;base64,${Buffer.from(logoSvg(options)).toString('base64')}`
}
