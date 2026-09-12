'use client'

import { Button } from '@/components/ui/Button'
import type { SaveStatus } from '@/hooks/useAutosave'

interface ExamHeaderProps {
  testTitle: string
  studentName: string
  studentIdentifier: string | null
  formattedTime: string
  isUntimed: boolean
  isWarning: boolean
  isCritical: boolean
  saveStatus: SaveStatus
  onSubmitClick: () => void
  isSubmitting: boolean
}

export function ExamHeader({
  testTitle,
  studentName,
  studentIdentifier,
  formattedTime,
  isUntimed,
  isWarning,
  isCritical,
  saveStatus,
  onSubmitClick,
  isSubmitting,
}: ExamHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Exam & Student Info */}
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate">
            {testTitle}
          </h1>
          <p className="text-xs text-gray-500 truncate">
            Student: <span className="font-semibold text-gray-700">{studentName}</span>
            {studentIdentifier && ` (${studentIdentifier})`}
          </p>
        </div>

        {/* Center: Timer & Autosave Status */}
        <div className="flex items-center gap-4">
          {/* Autosave badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {saveStatus === 'saved' && (
              <span className="text-green-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Saved
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Saving…
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-600 flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Save Failed
              </span>
            )}
          </div>

          {/* Countdown timer */}
          {!isUntimed && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold border transition-colors ${
                isCritical
                  ? 'bg-red-50 border-red-300 text-red-700 animate-pulse'
                  : isWarning
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}
              title="Time Remaining"
            >
              <span>⏱</span>
              <span>{formattedTime}</span>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            onClick={onSubmitClick}
            className="bg-brand-600 hover:bg-brand-700 font-semibold px-4"
          >
            Submit Exam
          </Button>
        </div>
      </div>
    </header>
  )
}

