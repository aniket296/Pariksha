'use client'

import type { StudentSafeQuestion } from '@/lib/actions/student'

interface QuestionPaletteProps {
  questions: StudentSafeQuestion[]
  currentIndex: number
  responses: Record<string, unknown>
  flaggedIds: Set<string>
  onSelectQuestion: (index: number) => void
}

export function QuestionPalette({
  questions,
  currentIndex,
  responses,
  flaggedIds,
  onSelectQuestion,
}: QuestionPaletteProps) {
  const isAnswered = (qId: string) => {
    const val = responses[qId]
    if (val === undefined || val === null || val === '') return false
    if (Array.isArray(val) && val.length === 0) return false
    if (typeof val === 'object' && Object.keys(val as object).length === 0) return false
    return true
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
          Question Navigator
        </h3>
        <span className="text-xs text-gray-400 font-mono">
          {questions.length} total
        </span>
      </div>

      {/* Grid of numbers */}
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
        {questions.map((q, idx) => {
          const answered = isAnswered(q.id)
          const flagged = flaggedIds.has(q.id)
          const isCurrent = currentIndex === idx

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelectQuestion(idx)}
              className={`relative flex items-center justify-center h-9 rounded-lg text-xs font-semibold font-mono transition-all ${
                isCurrent
                  ? 'ring-2 ring-brand-600 ring-offset-1 z-10'
                  : ''
              } ${
                answered
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
              title={`Question ${idx + 1} (${answered ? 'Answered' : 'Unanswered'}${
                flagged ? ', Flagged for review' : ''
              })`}
              aria-label={`Jump to question ${idx + 1}`}
            >
              {idx + 1}
              {flagged && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 border border-white rounded-full"
                  title="Flagged"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-600 inline-block" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-200 border border-gray-300 inline-block" />
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span>Flagged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-brand-600 inline-block" />
          <span>Current</span>
        </div>
      </div>
    </div>
  )
}

