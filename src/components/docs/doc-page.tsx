import Link from 'next/link'
import { ArrowLeft, ArrowRight, SquarePen } from 'lucide-react'
import { DocContent } from './doc-content'
import { DocToc } from './doc-toc'
import { docHref, docSourceUrl, docsNav, getAdjacentDocs, type Doc } from '@/lib/docs'
import { author, jsonLd } from '@/lib/seo'
import { site } from '@/lib/site'

export function DocPage({ doc }: { doc: Doc }) {
  const group = docsNav.find(g => g.items.some(item => item.slug === doc.slug))
  const { prev, next } = getAdjacentDocs(doc.slug)
  const url = `${site.url}${docHref(doc.slug)}`
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: doc.title,
        description: doc.description,
        url,
        image: `${url}/opengraph-image`,
        inLanguage: 'en',
        author,
        publisher: author,
        isPartOf: { '@type': 'WebSite', name: 'clockwork-tz', url: site.url },
        about: { '@type': 'SoftwareSourceCode', name: 'clockwork-tz', codeRepository: site.repo },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'clockwork-tz', item: site.url },
          { '@type': 'ListItem', position: 2, name: 'Docs', item: `${site.url}/docs` },
          ...(doc.slug ? [{ '@type': 'ListItem', position: 3, name: doc.title, item: url }] : []),
        ],
      },
    ],
  }

  return (
    <div className="flex gap-10 px-4 py-10 sm:px-6 lg:px-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
      <article className="min-w-0 flex-1 xl:max-w-3xl">
        <p className="font-mono text-xs font-medium tracking-wider text-accent uppercase">{group?.title}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{doc.title}</h1>
        <div className="mt-8">
          <DocContent html={doc.html} />
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-sm">
          <a href={docSourceUrl(doc.slug)} className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg">
            <SquarePen className="size-4" /> Edit this page on GitHub
          </a>
        </div>
        <nav aria-label="Pagination" className="mt-6 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link
              href={docHref(prev.slug)}
              className="group rounded-xl border border-border p-4 transition-colors hover:border-border-strong"
            >
              <span className="flex items-center gap-1 text-xs text-fg-faint">
                <ArrowLeft className="size-3" /> Previous
              </span>
              <span className="mt-1 block font-medium group-hover:text-accent">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={docHref(next.slug)}
              className="group rounded-xl border border-border p-4 text-right transition-colors hover:border-border-strong"
            >
              <span className="flex items-center justify-end gap-1 text-xs text-fg-faint">
                Next <ArrowRight className="size-3" />
              </span>
              <span className="mt-1 block font-medium group-hover:text-accent">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 overflow-y-auto py-2 xl:block">
        <DocToc toc={doc.toc} />
      </aside>
    </div>
  )
}
