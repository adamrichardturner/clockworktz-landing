import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        This page fell into a <span className="font-serif font-normal italic">DST gap</span>.
      </h1>
      <p className="mt-3 text-fg-muted">It never existed, or it was skipped. Try the docs instead.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/docs" className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:opacity-90">
          Documentation
        </Link>
        <Link href="/" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:border-border-strong">
          Home
        </Link>
      </div>
    </div>
  )
}
