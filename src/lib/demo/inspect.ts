/**
 * Render a value roughly the way Node's console.log does, so demo outputs
 * read like the "// =>" comments in the docs.
 */
export function inspect(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent)
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`
  if (typeof value === 'number') return Number.isNaN(value) ? 'NaN' : String(value)
  if (typeof value === 'boolean') return String(value)
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString()
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map(item => inspect(item, indent + 1))
    const inline = `[ ${items.join(', ')} ]`
    if (inline.length <= 72 && !inline.includes('\n')) return inline
    return `[\n${items.map(item => `${pad}  ${item}`).join(',\n')}\n${pad}]`
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined)
    if (entries.length === 0) return '{}'
    const items = entries.map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${inspect(v, indent + 1)}`)
    const inline = `{ ${items.join(', ')} }`
    if (inline.length <= 72 && !inline.includes('\n')) return inline
    return `{\n${items.map(item => `${pad}  ${item}`).join(',\n')}\n${pad}}`
  }
  return String(value)
}

export type Outcome<T> = { ok: true; value: T } | { ok: false; error: Error }

/** Run a library call and capture either its result or what it threw */
export function attempt<T>(fn: () => T): Outcome<T> {
  try {
    return { ok: true, value: fn() }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/** A string literal as it would appear in source code */
export function lit(value: string): string {
  return `'${value.replace(/'/g, "\\'")}'`
}
