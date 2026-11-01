import { ImageResponse } from 'next/og'

export const alt = 'clockwork-tz: timezones that get the weird zones right'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const zones = [
  ['Australia/Lord_Howe', '+10:30'],
  ['Pacific/Chatham', '+12:45'],
  ['Asia/Kathmandu', '+05:45'],
  ['Pacific/Marquesas', '−09:30'],
]

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#0d0c0b',
          color: '#ece8e1',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 34, fontWeight: 600 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              border: '9px solid #f59e0b',
              display: 'flex',
            }}
          />
          clockwork-tz
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05, maxWidth: 950 }}>
            Timezones that get the weird zones right.
          </div>
          <div style={{ fontSize: 30, color: '#a8a097' }}>
            Exact DST disambiguation · zero dependencies · optional pinned IANA tzdb
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {zones.map(([zone, offset]) => (
            <div
              key={zone}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '14px 20px',
                borderRadius: 14,
                border: '1px solid #3a352f',
                background: '#171513',
                fontSize: 22,
              }}
            >
              <span style={{ color: '#a8a097' }}>{zone}</span>
              <span style={{ color: '#f59e0b', fontSize: 30, fontWeight: 600 }}>{offset}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  )
}
