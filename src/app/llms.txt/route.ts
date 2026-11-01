import { docHref, docsNav, getDoc } from '@/lib/docs'
import { site } from '@/lib/site'

// https://llmstxt.org: an index of the docs for language models
async function body(): Promise<string> {
  'use cache'
  const sections = await Promise.all(
    docsNav.map(async group => {
      const lines = await Promise.all(
        group.items.map(async item => {
          const doc = await getDoc(item.slug)
          return `- [${item.title}](${site.url}${docHref(item.slug)}): ${doc?.description ?? ''}`
        })
      )
      return `## ${group.title}\n\n${lines.join('\n')}`
    })
  )
  return `# clockwork-tz\n\n> ${site.description}\n\nFull docs as Markdown: ${site.url}/llms-full.txt\n\n${sections.join('\n\n')}\n`
}

export async function GET() {
  return new Response(await body(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
