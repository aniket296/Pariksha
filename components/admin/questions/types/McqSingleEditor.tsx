'use client'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { McqSingleContent, McqSingleGradingKey, Choice } from '@/lib/types/database'

interface McqSingleEditorProps {
  content: McqSingleContent
  gradingKey: McqSingleGradingKey
  onChange: (content: McqSingleContent, gradingKey: McqSingleGradingKey) => void
}

export function McqSingleEditor({
  content,
  gradingKey,
  onChange,
}: McqSingleEditorProps) {
  const choices = content.choices || []

  const updateChoiceText = (id: string, text: string) => {
    const newChoices = choices.map((c) => (c.id === id ? { ...c, text } : c))
    onChange({ choices: newChoices }, gradingKey)
  }

  const togglePin = (id: string) => {
    const newChoices = choices.map((c) =>
      c.id === id ? { ...c, pinned: !c.pinned } : c
    )
    onChange({ choices: newChoices }, gradingKey)
  }

  const setCorrectChoice = (id: string) => {
    onChange(content, { correct_choice_id: id })
  }

  const addChoice = () => {
    const newId = `c_${Date.now()}`
    const newChoices: Choice[] = [
      ...choices,
      { id: newId, text: `Option ${choices.length + 1}` },
    ]
    onChange({ choices: newChoices }, gradingKey)
  }

  const removeChoice = (id: string) => {
    if (choices.length <= 2) return
    const newChoices = choices.filter((c) => c.id !== id)
    // If the removed choice was the correct choice, default to the first choice
    let newCorrect = gradingKey.correct_choice_id
    if (newCorrect === id && newChoices[0]) {
      newCorrect = newChoices[0].id
    }
    onChange({ choices: newChoices }, { correct_choice_id: newCorrect })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Answer Choices (Select the correct option)
        </label>
        <span className="text-xs text-gray-400">Radio button selects correct answer</span>
      </div>

      <div className="space-y-2">
        {choices.map((choice, index) => {
          const isCorrect = gradingKey.correct_choice_id === choice.id
          return (
            <div
              key={choice.id}
              className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
                isCorrect
                  ? 'border-green-300 bg-green-50/50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Radio for correct choice */}
              <label
                className="flex items-center cursor-pointer p-1"
                title="Mark as correct answer"
              >
                <input
                  type="radio"
                  name="correct_choice_radio"
                  checked={isCorrect}
                  onChange={() => setCorrectChoice(choice.id)}
                  className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer"
                  aria-label={`Mark choice ${index + 1} as correct`}
                />
              </label>

              {/* Choice text input */}
              <div className="flex-1">
                <Input
                  value={choice.text}
                  onChange={(e) => updateChoiceText(choice.id, e.target.value)}
                  placeholder={`Choice ${index + 1}`}
                  required
                />
              </div>

              {/* Pin option toggle */}
              <button
                type="button"
                onClick={() => togglePin(choice.id)}
                className={`p-1.5 rounded text-xs transition-colors ${
                  choice.pinned
                    ? 'bg-amber-100 text-amber-800 font-medium'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title={choice.pinned ? 'Pinned (will not shuffle)' : 'Click to pin position'}
                aria-label={choice.pinned ? 'Unpin choice' : 'Pin choice'}
              >
                {choice.pinned ? '📌 Pinned' : '📌 Pin'}
              </button>

              {/* Delete choice */}
              {choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeChoice(choice.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove choice"
                  aria-label={`Remove choice ${index + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={addChoice}
        className="mt-2"
      >
        + Add Choice
      </Button>
    </div>
  )
}
