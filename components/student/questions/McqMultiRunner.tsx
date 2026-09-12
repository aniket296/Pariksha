'use client'

import type { McqMultiContent } from '@/lib/types/database'

interface McqMultiRunnerProps {
  content: McqMultiContent
  value: string[] | undefined
  onChange: (choiceIds: string[]) => void
  disabled?: boolean
}

export function McqMultiRunner({
  content,
  value = [],
  onChange,
  disabled,
}: McqMultiRunnerProps) {
  const choices = content.choices || []

  const toggleChoice = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((cId) => cId !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className="space-y-2.5" role="group">
      <p className="text-xs text-gray-500 font-medium italic mb-1">
        (Select all options that apply)
      </p>

      {choices.map((choice, idx) => {
        const isChecked = value.includes(choice.id)
        return (
          <label
            key={choice.id}
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm transition-all cursor-pointer select-none ${
              isChecked
                ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20 font-medium text-gray-900'
                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              disabled={disabled}
              checked={isChecked}
              onChange={() => toggleChoice(choice.id)}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300 mt-0.5"
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

