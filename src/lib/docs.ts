import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Element, Root as HastRoot } from 'hast'
import type { Root as MdastRoot } from 'mdast'
import { toString } from 'hast-util-to-string'
import rehypeShiki from '@shikijs/rehype'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { site } from './site'
import { codeThemes } from './highlight'
import { docHref, docSlugs, docsNav } from './docs-nav'

export { docHref, docSlugs, docsNav, getAdjacentDocs, type DocGroup, type DocLink } from './docs-nav'

/**
 * Docs live in content/docs as plain GitHub-flavoured Markdown, so they read
 * the same on GitHub as on the site. README.md is the index page; every other
 * file is served at /docs/<file name>. Relative links between the files
 * (`./engines.md#signed-updates`) are rewritten to site routes.
 */
const DOCS_DIR = path.join(process.cwd(), 'content', 'docs')

export function docFile(slug: string): string {
  return `${slug || 'README'}.md`
}

export function docSourceUrl(slug: string): string {
  return `${site.docsRepo}/blob/main/content/docs/${docFile(slug)}`
}

export interface TocEntry {
  id: string
  text: string
  depth: 2 | 3
}

export interface Doc {
  slug: string
  title: string
  description: string
  html: string
  toc: TocEntry[]
}

/** Rewrite `./other.md#anchor` links to `/docs/other#anchor` */
function rewriteDocLink(href: string): string {
  const match = /^(?:\.\/)?([\w-]+)\.md(#.*)?$/.exec(href)
  if (!match) {
    return href
  }
  const [, file, hash = ''] = match
  return `${docHref(file === 'README' ? '' : file!)}${hash}`
}

function remarkDocLinks() {
  return (tree: MdastRoot) => {
    visit(tree, 'link', node => {
      node.url = rewriteDocLink(node.url)
    })
  }
}

/** Drop the leading H1 (rendered by the page header) and collect the TOC */
function rehypeDocMeta(meta: { title: string; toc: TocEntry[] }) {
  return (tree: HastRoot) => {
    const first = tree.children.findIndex(node => node.type === 'element')
    const h1 = tree.children[first] as Element | undefined
    if (h1?.tagName === 'h1') {
      meta.title = toString(h1)
      tree.children.splice(first, 1)
    }
    visit(tree, 'element', node => {
      if ((node.tagName === 'h2' || node.tagName === 'h3') && node.properties.id) {
        meta.toc.push({
          id: String(node.properties.id),
          text: toString(node),
          depth: node.tagName === 'h2' ? 2 : 3,
        })
      }
    })
  }
}

/** Tables scroll on their own instead of widening the page */
function rehypeWrapTables() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'table' && parent && index !== undefined) {
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrap'] },
          children: [node],
        }
      }
    })
  }
}

function describe(markdown: string): string {
  const paragraph = markdown
    .split(/\n{2,}/)
    .map(block => block.trim())
    .find(block => block && !/^[#>|`\-*!<[]/.test(block))
  const text = (paragraph ?? site.description)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
  // Search engines show about 160 characters; cut on a word boundary
  return text.length <= 160 ? text : `${text.slice(0, 157).replace(/\s+\S*$/, '')}…`
}

export async function renderMarkdown(markdown: string) {
  const meta = { title: '', toc: [] as TocEntry[] }
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAlert)
    .use(remarkDocLinks)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeDocMeta, meta)
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      test: ['h2', 'h3', 'h4'],
      properties: { className: ['anchor'], ariaHidden: 'true', tabIndex: -1 },
      content: { type: 'text', value: '#' },
    })
    .use(rehypeWrapTables)
    .use(rehypeShiki, { themes: codeThemes, defaultColor: false })
    .use(rehypeStringify)
    .process(markdown)
  return { html: String(file), ...meta }
}

export async function getDoc(slug: string): Promise<Doc | null> {
  'use cache'
  if (!docSlugs.includes(slug)) {
    return null
  }
  const markdown = await readFile(path.join(DOCS_DIR, docFile(slug)), 'utf8')
  const { html, title, toc } = await renderMarkdown(markdown)
  const link = docsNav.flatMap(group => group.items).find(item => item.slug === slug)
  return { slug, title, description: link?.description ?? describe(markdown), html, toc }
}

export async function getRawDoc(slug: string): Promise<string | null> {
  'use cache'
  if (!docSlugs.includes(slug)) {
    return null
  }
  return readFile(path.join(DOCS_DIR, docFile(slug)), 'utf8')
}
