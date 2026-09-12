'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ScheduleSettingsFormProps {
  openAt: string | null
  closeAt: string | null
  onChange: (fields: { open_at: string | null; close_at: string | null }) => void
}

// Convert ISO string to format required by <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
function toLocalDatetimeInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  return `${y}-${m}-${d}T${hh}:${mm}`
}

// Convert local datetime input string (YYYY-MM-DDTHH:mm) to ISO string
function fromLocalDatetimeInput(localStr: string): string | null {
  if (!localStr) return null
  const date = new Date(localStr)
  if (isNaN(date.getTime())) return null
  return date.toISOString()
}

export function ScheduleSettingsForm({
  openAt,
  closeAt,
  onChange,
}: ScheduleSettingsFormProps) {
  const [userTz, setUserTz] = useState('')

  useEffect(() => {
    try {
      setUserTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
    } catch {
      setUserTz('Local')
    }
  }, [])

  const handleOpenChange = (val: string) => {
    onChange({
      open_at: fromLocalDatetimeInput(val),
      close_at: closeAt,
    })
  }

  const handleCloseChange = (val: string) => {
    onChange({
      open_at: openAt,
      close_at: fromLocalDatetimeInput(val),
    })
  }

  const clearOpen = () => {
    onChange({ open_at: null, close_at: closeAt })
  }

  const clearClose = () => {
    onChange({ open_at: openAt, close_at: null })
  }

  // Pre-flight check: is close before open?
  const isInvalidRange =
    openAt &&
    closeAt &&
    new Date(closeAt).getTime() <= new Date(openAt).getTime()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Exam Schedule & Availability Window
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure when the exam automatically opens and closes for students.
          </p>
        </div>
        {userTz && (
          <span className="text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded">
            🕒 Timezone: {userTz}
          </span>
        )}
      </div>

      {isInvalidRange && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          ⚠️ <strong>Invalid Schedule:</strong> The closing date and time must be after the opening date and time.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Open Date & Time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Opens At (Optional)
            </label>
            {openAt && (
              <button
                type="button"
                onClick={clearOpen}
                className="text-[11px] text-gray-400 hover:text-red-600"
              >
                Clear
              </button>
            )}
          </div>
          <Input
            type="datetime-local"
            value={toLocalDatetimeInput(openAt)}
            onChange={(e) => handleOpenChange(e.target.value)}
          />
          <p className="text-xs text-gray-400">
            {openAt
              ? `Opens on ${new Date(openAt).toLocaleString()}`
              : 'Immediately accessible once published.'}
          </p>
        </div>

        {/* Close Date & Time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Closes At (Optional)
            </label>
            {closeAt && (
              <button
                type="button"
                onClick={clearClose}
                className="text-[11px] text-gray-400 hover:text-red-600"
              >
                Clear
              </button>
            )}
          </div>
          <Input
            type="datetime-local"
            value={toLocalDatetimeInput(closeAt)}
            onChange={(e) => handleCloseChange(e.target.value)}
          />
          <p className="text-xs text-gray-400">
            {closeAt
              ? `Closes on ${new Date(closeAt).toLocaleString()}`
              : 'Remains open indefinitely until archived or unpublished.'}
          </p>
        </div>
      </div>
    </div>
  )
}

