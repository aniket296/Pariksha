'use client'

import { Textarea } from '@/components/ui/Textarea'
import type { EssayContent } from '@/lib/types/database'

interface EssayRunnerProps {
  content: EssayContent
  value: string | undefined
  onChange: (val: string) => void
  disabled?: boolean
}

export function EssayRunner({
  content,
  value = '',
  onChange,
  disabled,
}: EssayRunnerProps) {
  // Compute word count
  const trimmed = value.trim()
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length

  const minWords = content?.min_words || 0
  const maxWords = content?.max_words || 0

  const hasMinLimit = minWords > 0
  const hasMaxLimit = maxWords > 0

  const isBelowMin = hasMinLimit && words < minWords
  const isAboveMax = hasMaxLimit && words > maxWords

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Your Response
      </label>

      <Textarea
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        placeholder="Type your essay response here..."
        className="text-sm leading-relaxed p-3.5"
      />

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div>
          Word count: <span className="font-semibold text-gray-800">{words}</span>
          {hasMaxLimit && ` / ${maxWords} max`}
          {hasMinLimit && ` (min: ${minWords})`}
        </div>

        {isBelowMin && (
          <span className="text-amber-600 font-medium">
            {minWords - words} more word(s) required to meet minimum
          </span>
        )}

        {isAboveMax && (
          <span className="text-red-600 font-medium">
            Warning: Exceeds limit by {words - maxWords} word(s)
          </span>
        )}
      </div>
    </div>
  )
}

