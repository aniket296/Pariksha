'use client'

import type { TrueFalseContent, TrueFalseGradingKey } from '@/lib/types/database'

interface TrueFalseEditorProps {
  content: TrueFalseContent
  gradingKey: TrueFalseGradingKey
  onChange: (content: TrueFalseContent, gradingKey: TrueFalseGradingKey) => void
}

export function TrueFalseEditor({
  content,
  gradingKey,
  onChange,
}: TrueFalseEditorProps) {
  const isTrue = gradingKey.correct_choice_id === 'true'

  const setCorrect = (val: 'true' | 'false') => {
    onChange(content, { correct_choice_id: val })
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
        Correct Answer
      </label>

      <div className="grid grid-cols-2 gap-3 max-w-sm">
        <button
          type="button"
          onClick={() => setCorrect('true')}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
            isTrue
              ? 'border-green-500 bg-green-50 text-green-800 shadow-sm ring-2 ring-green-400'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
          aria-pressed={isTrue}
        >
          <span className="text-lg">✓</span> True
        </button>

        <button
          type="button"
          onClick={() => setCorrect('false')}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
            !isTrue
              ? 'border-red-500 bg-red-50 text-red-800 shadow-sm ring-2 ring-red-400'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
          aria-pressed={!isTrue}
        >
          <span className="text-lg">✗</span> False
        </button>
      </div>
    </div>
  )
}

