'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { FillBlankContent, FillBlankGradingKey } from '@/lib/types/database'

interface FillBlankEditorProps {
  content: FillBlankContent
  gradingKey: FillBlankGradingKey
  onChange: (content: FillBlankContent, gradingKey: FillBlankGradingKey) => void
}

export function FillBlankEditor({
  content,
  gradingKey,
  onChange,
}: FillBlankEditorProps) {
  const [newAnswerInput, setNewAnswerInput] = useState('')
  const accepted = gradingKey.accepted_answers || []

  const toggleCaseSensitive = () => {
    onChange(
      { case_sensitive: !content.case_sensitive },
      gradingKey
    )
  }

  const addAnswer = () => {
    const trimmed = newAnswerInput.trim()
    if (!trimmed) return
    if (!accepted.includes(trimmed)) {
      onChange(content, { accepted_answers: [...accepted, trimmed] })
    }
    setNewAnswerInput('')
  }

  const removeAnswer = (index: number) => {
    if (accepted.length <= 1) return
    const newAnswers = accepted.filter((_, i) => i !== index)
    onChange(content, { accepted_answers: newAnswers })
  }

  const updateAnswer = (index: number, text: string) => {
    const newAnswers = [...accepted]
    newAnswers[index] = text
    onChange(content, { accepted_answers: newAnswers })
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Accepted Answers
          </label>
          <span className="text-xs text-gray-400">
            Students will be awarded points if their answer matches any of these
          </span>
        </div>

        <div className="space-y-2">
          {accepted.map((ans, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={ans}
                onChange={(e) => updateAnswer(idx, e.target.value)}
                placeholder={`Accepted variant ${idx + 1}`}
                required
              />
              {accepted.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAnswer(idx)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Remove variant"
                  aria-label={`Remove answer variant ${idx + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add alternative answer */}
        <div className="mt-2 flex items-center gap-2">
          <Input
            value={newAnswerInput}
            onChange={(e) => setNewAnswerInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addAnswer()
              }
            }}
            placeholder="Add alternative accepted answer (e.g. synonym or alternate spelling)"
          />
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={addAnswer}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Case sensitivity checkbox */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <input
          type="checkbox"
          id="case_sensitive_check"
          checked={content.case_sensitive}
          onChange={toggleCaseSensitive}
          className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300 cursor-pointer"
        />
        <label
          htmlFor="case_sensitive_check"
          className="text-sm font-medium text-gray-700 cursor-pointer select-none"
        >
          Case sensitive matching
        </label>
        <span className="text-xs text-gray-400">
          (If unchecked, &quot;Cat&quot; and &quot;cat&quot; are both accepted)
        </span>
      </div>
    </div>
  )
}

