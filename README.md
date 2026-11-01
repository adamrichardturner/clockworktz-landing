# clockworktz-landing

The website and documentation for [clockworktz](https://github.com/adamrichardturner/clockworktz), live at **[clockworktz.dev](https://clockworktz.dev)**.

- **Landing page:** [clockworktz.dev](https://clockworktz.dev)
- **Docs:** [clockworktz.dev/docs](https://clockworktz.dev/docs), also readable on GitHub in [`content/docs`](./content/docs)

## Docs are plain Markdown

Every docs page is a GitHub-flavoured Markdown file in [`content/docs`](./content/docs). The same files render on the site and on GitHub:

- `README.md` is the docs index (`/docs`); every other file is served at `/docs/<file name>`.
- Links between pages are relative (`./engines.md#signed-updates`), so they work on GitHub, and the site rewrites them to routes (`/docs/engines#signed-updates`).
- Heading anchors use GitHub's slug algorithm, so `#signed-updates` points at the same heading in both places.
- GitHub alerts (`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`…) and tables render on both.
- There's no frontmatter: the page title is the first `# heading`, and each page's meta description lives in `docsNav`.

To add a page, create `content/docs/<slug>.md` and add it to `docsNav` in [`src/lib/docs-nav.ts`](./src/lib/docs-nav.ts), with a meta description under 160 characters.

Code samples should show real output from the library. Run them against a build of clockworktz before committing.

## Linking from the clockworktz README

Badge:

```md
[![Docs](https://img.shields.io/badge/docs-clockworktz.dev-b45309)](https://clockworktz.dev/docs)
```

Deep links work with GitHub-style anchors, for example:

```md
See [DST gaps & overlaps](https://clockworktz.dev/docs/dst-disambiguation#the-four-strategies)
and the [API reference](https://clockworktz.dev/docs/api#conversion).
```

For tools and language models, [`/llms.txt`](https://clockworktz.dev/llms.txt) lists every page and [`/llms-full.txt`](https://clockworktz.dev/llms-full.txt) is all of them in one Markdown file.

## Development

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

```bash
npm run build   # production build (static)
npm run lint
```

Built with Next.js 16 (App Router), Tailwind CSS 4, Shiki (GitHub light and dark themes) and the unified/remark/rehype pipeline. Light, dark and system themes via `next-themes`. Deployed on Vercel.

## License

MIT © Adam Turner
