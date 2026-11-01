import { codeToHtml, type BundledLanguage } from 'shiki'

/** GitHub's own themes, so snippets look the same here and in the README */
export const codeThemes = { light: 'github-light', dark: 'github-dark' } as const

export async function highlight(code: string, lang: BundledLanguage = 'ts'): Promise<string> {
  'use cache'
  return codeToHtml(code.trim(), { lang, themes: codeThemes, defaultColor: false })
}
