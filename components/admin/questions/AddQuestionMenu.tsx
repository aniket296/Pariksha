'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { createQuestionAction } from '@/lib/actions/questions'
import type { QuestionType } from '@/lib/types/database'

interface AddQuestionMenuProps {
  testId: string
  onQuestionCreated?: (questionId: string) => void
}

const QUESTION_TYPES: Array<{
  type: QuestionType
  title: string
  description: string
  icon: string
}> = [
  {
    type: 'mcq_single',
    title: 'Multiple Choice (Single)',
    description: 'Students pick one correct option from a list',
    icon: '🔘',
  },
  {
    type: 'mcq_multi',
    title: 'Multiple Choice (Multiple)',
    description: 'Students pick one or more correct options',
    icon: '☑️',
  },
  {
    type: 'true_false',
    title: 'True / False',
    description: 'Binary true or false choice',
    icon: '⚖️',
  },
  {
    type: 'fill_blank',
    title: 'Fill in the Blank',
    description: 'Short answer matching acceptable variants',
    icon: '✍️',
  },
  {
    type: 'essay',
    title: 'Essay / Long Answer',
    description: 'Open response requiring manual grading',
    icon: '📝',
  },
  {
    type: 'matching',
    title: 'Matching Pairs',
    description: 'Pair premises on left with targets on right',
    icon: '🔗',
  },
]

export function AddQuestionMenu({ testId, onQuestionCreated }: AddQuestionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loadingType, setLoadingType] = useState<QuestionType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (type: QuestionType) => {
    setLoadingType(type)
    setError(null)
    try {
      const result = await createQuestionAction(testId, type)
      if (result.error) {
        setError(result.error)
      } else if (result.questionId) {
        setIsOpen(false)
        if (onQuestionCreated) {
          onQuestionCreated(result.questionId)
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create question')
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <div className="relative">
      {!isOpen ? (
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => setIsOpen(true)}
          className="gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Add Question
        </Button>
      ) : (
        <div className="bg-white rounded-xl border border-gray-300 shadow-lg p-4 max-w-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Select Question Type
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 rounded"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUESTION_TYPES.map((qt) => {
              const isLoading = loadingType === qt.type
              return (
                <button
                  key={qt.type}
                  type="button"
                  disabled={loadingType !== null}
                  onClick={() => handleCreate(qt.type)}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-500 hover:bg-brand-50/40 text-left transition-all group disabled:opacity-50"
                >
                  <span className="text-xl mt-0.5">{qt.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-900 group-hover:text-brand-700">
                      {qt.title}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      {isLoading ? 'Creating...' : qt.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
