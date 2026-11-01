import { docSlugs, getRawDoc } from '@/lib/docs'

// Every docs page as one Markdown file
async function body(): Promise<string> {
  'use cache'
  const pages = await Promise.all(docSlugs.map(slug => getRawDoc(slug)))
  return pages.filter(Boolean).join('\n\n---\n\n')
}

export async function GET() {
  return new Response(await body(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
