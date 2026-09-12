'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { gradeEssayResponseAction } from '@/lib/actions/grading'
import type { EssayContent } from '@/lib/types/database'

export interface EssayItemData {
  questionId: string
  prompt: string
  points: number
  content: EssayContent
  studentAnswer: string
  awardedPoints: number | null
  teacherComment: string | null
}

interface EssayGradingFormProps {
  testId: string
  attemptId: string
  studentName: string
  studentIdentifier: string | null
  attemptStatus: string
  currentScore: number | null
  maxScore: number
  essayItems: EssayItemData[]
}

export function EssayGradingForm({
  testId,
  attemptId,
  studentName,
  studentIdentifier,
  attemptStatus,
  currentScore,
  maxScore,
  essayItems,
}: EssayGradingFormProps) {
  const [items, setItems] = useState<EssayItemData[]>(essayItems)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({})

  const handleSaveItem = async (item: EssayItemData) => {
    setSavingId(item.questionId)
    setFeedback((prev) => ({ ...prev, [item.questionId]: { type: 'success', text: '' } }))

    try {
      const res = await gradeEssayResponseAction(
        testId,
        attemptId,
        item.questionId,
        item.awardedPoints ?? 0,
        item.teacherComment || undefined
      )

      if (res.error) {
        setFeedback((prev) => ({
          ...prev,
          [item.questionId]: { type: 'error', text: res.error! },
        }))
      } else {
        setFeedback((prev) => ({
          ...prev,
          [item.questionId]: { type: 'success', text: 'Grade saved.' },
        }))
        setTimeout(() => {
          setFeedback((prev) => {
            const next = { ...prev }
            delete next[item.questionId]
            return next
          })
        }, 3000)
      }
    } catch (err: unknown) {
      setFeedback((prev) => ({
        ...prev,
        [item.questionId]: {
          type: 'error',
          text: err instanceof Error ? err.message : 'Failed to save',
        },
      }))
    } finally {
      setSavingId(null)
    }
  }

  const updateItemScore = (qId: string, pts: number) => {
    setItems((prev) =>
      prev.map((it) => (it.questionId === qId ? { ...it, awardedPoints: pts } : it))
    )
  }

  const updateItemComment = (qId: string, comment: string) => {
    setItems((prev) =>
      prev.map((it) => (it.questionId === qId ? { ...it, teacherComment: comment } : it))
    )
  }

  return (
    <div className="space-y-6">
      {/* Student Overview Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Student: {studentName}
          </h2>
          <p className="text-xs text-gray-500">
            ID: {studentIdentifier || '—'} • Status: <span className="font-semibold uppercase">{attemptStatus}</span>
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500">Current Score</div>
          <div className="text-2xl font-bold text-gray-900">
            {currentScore ?? 0} <span className="text-xs text-gray-400 font-normal">/ {maxScore} pts</span>
          </div>
        </div>
      </div>

      {/* Essay Questions List */}
      <div className="space-y-6">
        {items.map((item, idx) => {
          const wordCount = item.studentAnswer
            ? item.studentAnswer.trim().split(/\s+/).filter(Boolean).length
            : 0
          const minWords = item.content?.min_words || 0
          const maxWords = item.content?.max_words || 0

          const fb = feedback[item.questionId]

          return (
            <article
              key={item.questionId}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4"
            >
              {/* Question header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    Essay {idx + 1}
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    Max: {item.points} {item.points === 1 ? 'point' : 'points'}
                  </span>
                </div>

                <div className="text-xs text-gray-400">
                  {wordCount} words{' '}
                  {minWords > 0 && `(min ${minWords})`}
                  {maxWords > 0 && `(max ${maxWords})`}
                </div>
              </div>

              {/* Prompt */}
              <h3 className="text-base font-semibold text-gray-900">
                {item.prompt}
              </h3>

              {/* Student Response */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Student&apos;s Answer
                </span>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm leading-relaxed text-gray-900 whitespace-pre-wrap">
                  {item.studentAnswer || (
                    <span className="text-gray-400 italic">No response submitted.</span>
                  )}
                </div>
              </div>

              {/* Grading Controls */}
              <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Awarded Points (0 to {item.points})
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={item.points}
                    step={0.5}
                    value={item.awardedPoints ?? ''}
                    onChange={(e) =>
                      updateItemScore(item.questionId, parseFloat(e.target.value) || 0)
                    }
                    placeholder={`0 - ${item.points}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Teacher Feedback / Comments (Optional)
                  </label>
                  <Textarea
                    rows={2}
                    value={item.teacherComment || ''}
                    onChange={(e) =>
                      updateItemComment(item.questionId, e.target.value)
                    }
                    placeholder="Provide constructive feedback for the student..."
                  />
                </div>
              </div>

              {/* Feedback Alert */}
              {fb && fb.text && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-medium ${
                    fb.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {fb.text}
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={savingId === item.questionId}
                  onClick={() => handleSaveItem(item)}
                >
                  Save Essay Grade
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

