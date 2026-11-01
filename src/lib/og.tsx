import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { logoDataUri } from './logo-svg'

// 1200×630 PNG works everywhere links are shared: X/Twitter large cards,
// Facebook, LinkedIn, Slack, Discord, iMessage and WhatsApp (which needs the
// file to stay well under 600 kB; these come out around 100 kB).
export const ogSize = { width: 1200, height: 630 }
export const ogContentType = 'image/png'

const colors = {
  bg: '#0d0c0b',
  surface: '#171513',
  border: '#2a2622',
  fg: '#ece8e1',
  muted: '#a8a097',
  faint: '#776f66',
  accent: '#f59e0b',
}

const fontDir = path.join(process.cwd(), 'src', 'assets', 'fonts')

// Read once when the module loads, not per request, so images prerender at build time
const fonts = loadFonts()

async function loadFonts() {
  const [regular, semibold, mono, serif] = await Promise.all(
    ['Geist-Regular.ttf', 'Geist-SemiBold.ttf', 'GeistMono-Medium.ttf', 'InstrumentSerif-Italic.ttf'].map(file =>
      readFile(path.join(fontDir, file))
    )
  )
  return [
    { name: 'Geist', data: regular!, weight: 400 as const, style: 'normal' as const },
    { name: 'Geist', data: semibold!, weight: 600 as const, style: 'normal' as const },
    { name: 'Geist Mono', data: mono!, weight: 500 as const, style: 'normal' as const },
    { name: 'Instrument Serif', data: serif!, weight: 400 as const, style: 'italic' as const },
  ]
}

function Frame({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        backgroundColor: colors.bg,
        backgroundImage: `linear-gradient(to right, ${colors.border} 1px, transparent 1px), linear-gradient(to bottom, ${colors.border} 1px, transparent 1px)`,
        backgroundSize: '56px 56px',
        color: colors.fg,
        fontFamily: 'Geist',
        position: 'relative',
      }}
    >
      {/* Fade the grid towards the bottom */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          backgroundImage: `linear-gradient(to bottom, rgba(13,12,11,0.35), ${colors.bg} 78%)`,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUri()} width={64} height={64} alt="" />
        <span style={{ fontFamily: 'Geist Mono', fontSize: 36, fontWeight: 500, letterSpacing: -1 }}>
          clockwork-tz
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>{children}</div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          fontFamily: 'Geist Mono',
          fontSize: 24,
          color: colors.muted,
        }}
      >
        {footer}
      </div>
    </div>
  )
}

const zones: [string, string][] = [
  ['Lord_Howe', '+10:30'],
  ['Chatham', '+12:45'],
  ['Kathmandu', '+05:45'],
  ['Marquesas', '−09:30'],
]

/** The site-wide card: logo, tagline and a row of unusual offsets */
export async function renderHomeOg() {
  return new ImageResponse(
    (
      <Frame
        footer={
          <>
            <span>$ npm install clockwork-tz</span>
            <span style={{ color: colors.fg }}>clockworktz.dev</span>
          </>
        }
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 84, fontWeight: 600, letterSpacing: -3, lineHeight: 1.04 }}>
          <span>Timezones that get the&nbsp;</span>
          <span style={{ fontFamily: 'Instrument Serif', fontStyle: 'italic', fontWeight: 400, color: colors.accent, letterSpacing: -1 }}>
            weird zones
          </span>
          <span>&nbsp;right.</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 30, color: colors.muted }}>
          Exact DST disambiguation · zero dependencies · optional pinned IANA tzdb
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 44 }}>
          {zones.map(([zone, offset]) => (
            <div
              key={zone}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 18px',
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface,
                fontFamily: 'Geist Mono',
                fontSize: 22,
              }}
            >
              <span style={{ color: colors.muted }}>{zone}</span>
              <span style={{ color: colors.accent }}>{offset}</span>
            </div>
          ))}
        </div>
      </Frame>
    ),
    { ...ogSize, fonts: await fonts }
  )
}

/** A docs page card: section, title and summary */
export async function renderDocOg({ section, title, description, url }: { section: string; title: string; description: string; url: string }) {
  const summary = description.length > 150 ? `${description.slice(0, 147).trimEnd()}…` : description
  return new ImageResponse(
    (
      <Frame
        footer={
          <>
            <span>{url}</span>
            <span style={{ color: colors.fg }}>Read the docs →</span>
          </>
        }
      >
        <div style={{ fontFamily: 'Geist Mono', fontSize: 24, color: colors.accent, textTransform: 'uppercase', letterSpacing: 2 }}>
          {`Docs · ${section}`}
        </div>
        <div style={{ marginTop: 18, fontSize: 76, fontWeight: 600, letterSpacing: -2.5, lineHeight: 1.05 }}>{title}</div>
        <div style={{ marginTop: 24, fontSize: 30, lineHeight: 1.4, color: colors.muted, maxWidth: 1000 }}>{summary}</div>
      </Frame>
    ),
    { ...ogSize, fonts: await fonts }
  )
}

/** Square app icon: the logo on the site's dark background */
export function renderIcon(size: number) {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUri()} width={size * 0.78} height={size * 0.78} alt="" />
      </div>
    ),
    { width: size, height: size }
  )
}
