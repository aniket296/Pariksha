import { describe, it, expect } from 'vitest'
import { parseWhitelistCsv } from '@/lib/utils/csv'

describe('CSV Utilities — parseWhitelistCsv', () => {
  it('parses comma-separated entries', () => {
    const csv = 'Alice,STUDENT_001\nBob,STUDENT_002'
    const result = parseWhitelistCsv(csv)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'Alice', identifier: 'STUDENT_001' })
    expect(result[1]).toEqual({ name: 'Bob', identifier: 'STUDENT_002' })
  })

  it('skips header line when header contains "name"', () => {
    const csv = 'Name,Roll Number\nCharlie,101\nDavid,102'
    const result = parseWhitelistCsv(csv)
    expect(result).toHaveLength(2)
    expect(result[0]?.name).toBe('Charlie')
  })

  it('handles quotes and whitespace cleanly', () => {
    const csv = '"Eve Adams" , "EV_99"\n"Frank", '
    const result = parseWhitelistCsv(csv)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'Eve Adams', identifier: 'EV_99' })
    expect(result[1]?.name).toBe('Frank')
  })

  it('returns empty array for empty or whitespace input', () => {
    expect(parseWhitelistCsv('')).toEqual([])
    expect(parseWhitelistCsv('   \n  \n')).toEqual([])
  })
})

