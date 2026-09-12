'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { parseWhitelistCsv } from '@/lib/utils/csv'
import type { AccessType, WhitelistEntry } from '@/lib/types/database'

interface AccessSettingsFormProps {
  accessType: AccessType
  passcode: string | null
  maxAttempts: number
  whitelistData: WhitelistEntry[]
  onChange: (fields: {
    access_type: AccessType
    passcode: string | null
    max_attempts: number
    whitelist_data: WhitelistEntry[]
  }) => void
}

export function AccessSettingsForm({
  accessType,
  passcode,
  maxAttempts,
  whitelistData,
  onChange,
}: AccessSettingsFormProps) {
  const [rawCsvInput, setRawCsvInput] = useState('')
  const [showWhitelistModal, setShowWhitelistModal] = useState(false)
  const [parseNotice, setParseNotice] = useState<string | null>(null)

  const handleImportCsv = () => {
    if (!rawCsvInput.trim()) return
    const parsed = parseWhitelistCsv(rawCsvInput)
    if (parsed.length === 0) {
      setParseNotice('No valid rows found. Ensure each line has at least a student name.')
      return
    }

    const merged = [...whitelistData, ...parsed]
    onChange({
      access_type: accessType,
      passcode,
      max_attempts: maxAttempts,
      whitelist_data: merged,
    })
    setRawCsvInput('')
    setParseNotice(`Successfully imported ${parsed.length} students.`)
    setTimeout(() => setParseNotice(null), 3000)
  }

  const handleRemoveWhitelistItem = (index: number) => {
    const updated = whitelistData.filter((_, i) => i !== index)
    onChange({
      access_type: accessType,
      passcode,
      max_attempts: maxAttempts,
      whitelist_data: updated,
    })
  }

  const handleClearWhitelist = () => {
    if (!confirm('Clear all students from the whitelist?')) return
    onChange({
      access_type: accessType,
      passcode,
      max_attempts: maxAttempts,
      whitelist_data: [],
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Student Identification & Access
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Define how students identify themselves to take this test.
        </p>
      </div>

      {/* Access Type Selection */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Student Access Requirement
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Name Only */}
          <label
            className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${
              accessType === 'name_only'
                ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">Name Only</span>
              <input
                type="radio"
                name="access_type"
                checked={accessType === 'name_only'}
                onChange={() =>
                  onChange({
                    access_type: 'name_only',
                    passcode,
                    max_attempts: maxAttempts,
                    whitelist_data: whitelistData,
                  })
                }
                className="text-brand-600 focus:ring-brand-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              Students enter their full name. No accounts or IDs required.
            </p>
          </label>

          {/* Name and ID */}
          <label
            className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${
              accessType === 'name_and_id'
                ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">Name & Student ID</span>
              <input
                type="radio"
                name="access_type"
                checked={accessType === 'name_and_id'}
                onChange={() =>
                  onChange({
                    access_type: 'name_and_id',
                    passcode,
                    max_attempts: maxAttempts,
                    whitelist_data: whitelistData,
                  })
                }
                className="text-brand-600 focus:ring-brand-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              Collects both student name and Roll / Matriculation / Student ID number.
            </p>
          </label>

          {/* Whitelist */}
          <label
            className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${
              accessType === 'whitelist'
                ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">Pre-Approved Roster</span>
              <input
                type="radio"
                name="access_type"
                checked={accessType === 'whitelist'}
                onChange={() =>
                  onChange({
                    access_type: 'whitelist',
                    passcode,
                    max_attempts: maxAttempts,
                    whitelist_data: whitelistData,
                  })
                }
                className="text-brand-600 focus:ring-brand-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              Only students whose names or IDs match a pre-uploaded roster can start.
            </p>
          </label>
        </div>
      </div>

      {/* Whitelist Management Section (Shown if Whitelist is active) */}
      {accessType === 'whitelist' && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Approved Student Roster ({whitelistData.length} students)
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Paste student names and IDs or import a CSV list.
              </p>
            </div>
            {whitelistData.length > 0 && (
              <button
                type="button"
                onClick={handleClearWhitelist}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear all
              </button>
            )}
          </div>

          {/* CSV Paste / Entry Box */}
          <div className="space-y-2">
            <textarea
              value={rawCsvInput}
              onChange={(e) => setRawCsvInput(e.target.value)}
              rows={3}
              placeholder="Paste roster rows here:&#10;Alice Smith, STU101&#10;Bob Johnson, STU102&#10;Carol Williams"
              className="w-full text-xs font-mono rounded-md border border-gray-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Format: <code>Student Name, Identifier</code> (one per line)
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleImportCsv}
              >
                Add to Roster
              </Button>
            </div>
          </div>

          {parseNotice && (
            <div className="text-xs p-2 rounded bg-green-100 text-green-800 border border-green-200">
              {parseNotice}
            </div>
          )}

          {/* Roster Preview Table */}
          {whitelistData.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded border border-gray-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Student Name</th>
                    <th className="p-2">ID / Identifier</th>
                    <th className="p-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {whitelistData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 text-gray-400 font-mono">{idx + 1}</td>
                      <td className="p-2 font-medium text-gray-900">{item.name}</td>
                      <td className="p-2 text-gray-500 font-mono">
                        {item.identifier || '—'}
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveWhitelistItem(idx)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          aria-label={`Remove ${item.name}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Passcode Protection & Max Attempts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Exam Passcode (Optional)
          </label>
          <Input
            type="text"
            value={passcode || ''}
            onChange={(e) =>
              onChange({
                access_type: accessType,
                passcode: e.target.value.trim() === '' ? null : e.target.value,
                max_attempts: maxAttempts,
                whitelist_data: whitelistData,
              })
            }
            placeholder="Leave empty for no passcode"
          />
          <span className="text-xs text-gray-400 mt-1 block">
            Students must provide this PIN/password before the exam starts.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Maximum Attempts Per Student
          </label>
          <Input
            type="number"
            min={0}
            value={maxAttempts}
            onChange={(e) =>
              onChange({
                access_type: accessType,
                passcode,
                max_attempts: Math.max(0, parseInt(e.target.value) || 0),
                whitelist_data: whitelistData,
              })
            }
            placeholder="0 for unlimited"
          />
          <span className="text-xs text-gray-400 mt-1 block">
            {maxAttempts === 0 ? '0 = Unlimited attempts' : `${maxAttempts} attempt(s) allowed per student`}
          </span>
        </div>
      </div>
    </div>
  )
}
