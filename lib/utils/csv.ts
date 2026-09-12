import type { WhitelistEntry } from '@/lib/types/database'

/**
 * Parse raw CSV or delimited text roster into WhitelistEntry array.
 * Supports comma, tab, and semicolon delimiters.
 * Auto-detects and skips header row if 'name' is in the first row.
 */
export function parseWhitelistCsv(text: string): WhitelistEntry[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return []

  const entries: WhitelistEntry[] = []
  const hasHeader = /name/i.test(lines[0] || '')

  const startIndex = hasHeader ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    // Handle comma or tab or semicolon separation
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''))
    const name = parts[0]
    const identifier = parts[1]

    if (name) {
      entries.push({
        name,
        ...(identifier ? { identifier } : {}),
      })
    }
  }

  return entries
}
