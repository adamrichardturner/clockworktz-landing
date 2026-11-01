/** A clock face whose rim is a gear: clockwork */
export function LogoMark({ className }: { className?: string }) {
  const teeth = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <g fill="var(--accent)">
        {teeth.map(angle => (
          <rect key={angle} x="14.5" y="1" width="3" height="5" rx="1" transform={`rotate(${angle} 16 16)`} />
        ))}
      </g>
      <circle cx="16" cy="16" r="11" fill="var(--accent)" />
      <circle cx="16" cy="16" r="8.5" fill="var(--bg)" />
      <path d="M16 10.5V16l3.6 2.4" fill="none" stroke="var(--fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="1.4" fill="var(--fg)" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-mono text-[0.95rem] font-semibold tracking-tight whitespace-nowrap">
      <LogoMark className="size-7" />
      clockwork-tz
    </span>
  )
}
