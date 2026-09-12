'use client'

import { useState } from 'react'
import { QuestionCard } from './QuestionCard'
import { QuestionEditor } from './QuestionEditor'
import { AddQuestionMenu } from './AddQuestionMenu'
import { reorderQuestionsAction } from '@/lib/actions/questions'
import type { Database } from '@/lib/types/database'

type QuestionRow = Database['public']['Tables']['questions']['Row']

interface QuestionListProps {
  testId: string
  questions: QuestionRow[]
}

export function QuestionList({ testId, questions }: QuestionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  // Sort questions by order_index
  const sortedQuestions = [...questions].sort(
    (a, b) => a.order_index - b.order_index
  )

  const totalPoints = sortedQuestions.reduce((acc, q) => acc + q.points, 0)
  const pinnedCount = sortedQuestions.filter((q) => q.is_pinned).length

  const handleMove = async (currentIndex: number, targetIndex: number) => {
    if (
      currentIndex < 0 ||
      currentIndex >= sortedQuestions.length ||
      targetIndex < 0 ||
      targetIndex >= sortedQuestions.length
    ) {
      return
    }

    const reordered = [...sortedQuestions]
    const [moved] = reordered.splice(currentIndex, 1)
    if (!moved) return
    reordered.splice(targetIndex, 0, moved)

    setIsReordering(true)
    try {
      const orderedIds = reordered.map((q) => q.id)
      await reorderQuestionsAction(testId, orderedIds)
    } finally {
      setIsReordering(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">Questions</h2>
            <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
              {sortedQuestions.length} {sortedQuestions.length === 1 ? 'question' : 'questions'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Total Points: <span className="font-semibold text-gray-800">{totalPoints}</span>
            {pinnedCount > 0 && (
              <span className="ml-2 text-amber-700 font-medium">
                • {pinnedCount} pinned
              </span>
            )}
          </p>
        </div>

        <AddQuestionMenu
          testId={testId}
          onQuestionCreated={(newId) => setEditingId(newId)}
        />
      </div>

      {/* Empty State */}
      {sortedQuestions.length === 0 && (
        <div className="text-center py-12 rounded-xl bg-gray-50 border border-dashed border-gray-200">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 mb-3"
            aria-hidden="true"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12h6M12 9v6M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            No questions added yet
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Click &quot;Add Question&quot; above to choose from 6 question types (MCQ, True/False, Fill in Blank, Essay, Matching).
          </p>
        </div>
      )}

      {/* Questions Stack */}
      {sortedQuestions.length > 0 && (
        <div className={`space-y-3 ${isReordering ? 'opacity-60 pointer-events-none' : ''}`}>
          {sortedQuestions.map((question, index) => {
            if (editingId === question.id) {
              return (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  onClose={() => setEditingId(null)}
                />
              )
            }

            return (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                totalCount={sortedQuestions.length}
                onEdit={() => setEditingId(question.id)}
                onMoveUp={() => handleMove(index, index - 1)}
                onMoveDown={() => handleMove(index, index + 1)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

