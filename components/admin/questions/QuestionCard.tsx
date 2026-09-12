'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  deleteQuestionAction,
  duplicateQuestionAction,
  updateQuestionAction,
} from '@/lib/actions/questions'
import type { Database } from '@/lib/types/database'

type QuestionRow = Database['public']['Tables']['questions']['Row']

interface QuestionCardProps {
  question: QuestionRow
  index: number
  totalCount: number
  onEdit: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export function QuestionCard({
  question,
  index,
  totalCount,
  onEdit,
  onMoveUp,
  onMoveDown,
}: QuestionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isTogglingPin, setIsTogglingPin] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this question?')) return
    setIsDeleting(true)
    try {
      await deleteQuestionAction(question.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      await duplicateQuestionAction(question.id)
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleTogglePin = async () => {
    setIsTogglingPin(true)
    try {
      await updateQuestionAction(question.id, {
        prompt: question.prompt,
        points: question.points,
        negative_points: question.negative_points,
        is_pinned: !question.is_pinned,
        explanation: question.explanation,
        content: question.content,
        grading_key: question.grading_key,
      })
    } finally {
      setIsTogglingPin(false)
    }
  }

  const typeLabels: Record<string, string> = {
    mcq_single: 'MCQ (Single)',
    mcq_multi: 'MCQ (Multi)',
    true_false: 'True / False',
    fill_blank: 'Fill in Blank',
    essay: 'Essay',
    matching: 'Matching',
  }

  return (
    <div
      className={`bg-white rounded-xl border p-4 transition-all shadow-sm ${
        question.is_pinned
          ? 'border-amber-300 bg-amber-50/10'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Index, Type Badge, Points & Pin */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
            Q{index + 1}
          </span>
          <Badge variant="blue">{typeLabels[question.type] || question.type}</Badge>
          <span className="text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
            {question.points} {question.points === 1 ? 'pt' : 'pts'}
          </span>
          {question.negative_points > 0 && (
            <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              -{question.negative_points} penalty
            </span>
          )}
          {question.is_pinned && (
            <span className="text-xs font-medium text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded">
              📌 Pinned
            </span>
          )}
        </div>

        {/* Right: Reordering & Action Controls */}
        <div className="flex items-center gap-1">
          {/* Move Up */}
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded"
            title="Move Question Up"
            aria-label={`Move question ${index + 1} up`}
          >
            ▲
          </button>
          {/* Move Down */}
          <button
            type="button"
            disabled={index === totalCount - 1}
            onClick={onMoveDown}
            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded"
            title="Move Question Down"
            aria-label={`Move question ${index + 1} down`}
          >
            ▼
          </button>

          <div className="h-4 w-[1px] bg-gray-200 mx-1" />

          {/* Direct Pin toggle */}
          <button
            type="button"
            disabled={isTogglingPin}
            onClick={handleTogglePin}
            className={`p-1 text-xs rounded transition-colors ${
              question.is_pinned
                ? 'text-amber-700 hover:bg-amber-100'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={question.is_pinned ? 'Unpin question' : 'Pin question'}
            aria-label={question.is_pinned ? 'Unpin question' : 'Pin question'}
          >
            📌
          </button>

          {/* Duplicate */}
          <button
            type="button"
            disabled={isDuplicating}
            onClick={handleDuplicate}
            className="p-1 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Duplicate question"
            aria-label="Duplicate question"
          >
            📋
          </button>

          {/* Delete */}
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="p-1 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete question"
            aria-label="Delete question"
          >
            🗑️
          </button>

          {/* Edit */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onEdit}
            className="ml-1"
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Prompt preview */}
      <div className="mt-3 text-sm text-gray-900 line-clamp-2">
        {question.prompt}
      </div>
    </div>
  )
}

