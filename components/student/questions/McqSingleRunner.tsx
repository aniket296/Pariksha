'use client'

import type { McqSingleContent } from '@/lib/types/database'

interface McqSingleRunnerProps {
  content: McqSingleContent
  value: string | undefined
  onChange: (choiceId: string) => void
  disabled?: boolean
}

export function McqSingleRunner({
  content,
  value,
  onChange,
  disabled,
}: McqSingleRunnerProps) {
  const choices = content.choices || []

  return (
    <div className="space-y-2.5" role="radiogroup">
      {choices.map((choice, idx) => {
        const isSelected = value === choice.id
        return (
          <label
            key={choice.id}
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm transition-all cursor-pointer select-none ${
              isSelected
                ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20 font-medium text-gray-900'
                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="mcq_single_option"
              disabled={disabled}
              checked={isSelected}
              onChange={() => onChange(choice.id)}
              className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300 mt-0.5"
            />
            <div className="flex items-start gap-2 flex-1">
              <span className="text-xs font-semibold text-gray-400 font-mono mt-0.5">
                {String.fromCharCode(65 + idx)}.
              </span>
              <span className="leading-relaxed">{choice.text}</span>
            </div>
          </label>
        )
      })}
    </div>
  )
}

