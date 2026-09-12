'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { McqSingleEditor } from './types/McqSingleEditor'
import { McqMultiEditor } from './types/McqMultiEditor'
import { TrueFalseEditor } from './types/TrueFalseEditor'
import { FillBlankEditor } from './types/FillBlankEditor'
import { EssayEditor } from './types/EssayEditor'
import { MatchingEditor } from './types/MatchingEditor'
import { updateQuestionAction, type UpdateQuestionPayload } from '@/lib/actions/questions'
import type {
  Database,
  QuestionContent,
  GradingKey,
  McqSingleContent,
  McqSingleGradingKey,
  McqMultiContent,
  McqMultiGradingKey,
  TrueFalseContent,
  TrueFalseGradingKey,
  FillBlankContent,
  FillBlankGradingKey,
  EssayContent,
  EssayGradingKey,
  MatchingContent,
  MatchingGradingKey,
} from '@/lib/types/database'

type QuestionRow = Database['public']['Tables']['questions']['Row']

interface QuestionEditorProps {
  question: QuestionRow
  onClose: () => void
  onSaved?: () => void
}

export function QuestionEditor({ question, onClose, onSaved }: QuestionEditorProps) {
  const [prompt, setPrompt] = useState(question.prompt)
  const [points, setPoints] = useState(question.points)
  const [negativePoints, setNegativePoints] = useState(question.negative_points)
  const [isPinned, setIsPinned] = useState(question.is_pinned)
  const [explanation, setExplanation] = useState(question.explanation || '')
  const [content, setContent] = useState<QuestionContent>(question.content)
  const [gradingKey, setGradingKey] = useState<GradingKey>(question.grading_key)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    const payload: UpdateQuestionPayload = {
      prompt,
      points,
      negative_points: negativePoints,
      is_pinned: isPinned,
      explanation: explanation.trim() || null,
      content,
      grading_key: gradingKey,
    }

    try {
      const res = await updateQuestionAction(question.id, payload)
      if (res.error) {
        setError(res.error)
      } else {
        if (onSaved) onSaved()
        onClose()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save question')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="p-5 bg-white border border-brand-200 rounded-xl shadow-sm space-y-5"
    >
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700">
            {question.type.replace('_', ' ')}
          </span>
          <span className="text-xs text-gray-400">Editing Question</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm font-bold"
          aria-label="Close editor"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      {/* Prompt */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
          Question Prompt / Instructions <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Enter question text here..."
          required
        />
      </div>

      {/* Type-Specific Answer & Key Editor */}
      <div className="pt-2 border-t border-gray-100">
        {question.type === 'mcq_single' && (
          <McqSingleEditor
            content={content as McqSingleContent}
            gradingKey={gradingKey as McqSingleGradingKey}
            onChange={(c, k) => {
              setContent(c)
              setGradingKey(k)
            }}
          />
        )}

        {question.type === 'mcq_multi' && (
          <McqMultiEditor
            content={content as McqMultiContent}
            gradingKey={gradingKey as McqMultiGradingKey}
            onChange={(c, k) => {
              setContent(c)
              setGradingKey(k)
            }}
          />
        )}

        {question.type === 'true_false' && (
          <TrueFalseEditor
            content={content as TrueFalseContent}
            gradingKey={gradingKey as TrueFalseGradingKey}
            onChange={(c, k) => {
              setContent(c)
              setGradingKey(k)
            }}
          />
        )}

        {question.type === 'fill_blank' && (
          <FillBlankEditor
            content={content as FillBlankContent}
            gradingKey={gradingKey as FillBlankGradingKey}
            onChange={(c, k) => {
              setContent(c)
              setGradingKey(k)
            }}
          />
        )}

        {question.type === 'essay' && (
          <EssayEditor
            content={content as EssayContent}
            gradingKey={gradingKey as EssayGradingKey}
            onChange={(c, k) => {
              setContent(c)
              setGradingKey(k)
            }}
          />
        )}

        {question.type === 'matching' && (
          <MatchingEditor
            content={content as MatchingContent}
            gradingKey={gradingKey as MatchingGradingKey}
            onChange={(c, k) => {
              setContent(c)
              setGradingKey(k)
            }}
          />
        )}
      </div>

      {/* Scoring & Pinning Controls */}
      <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Points
          </label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={points}
            onChange={(e) => setPoints(parseFloat(e.target.value) || 0)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Penalty (Negative Points)
          </label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={negativePoints}
            onChange={(e) => setNegativePoints(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 pb-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300"
            />
            <span className="text-xs font-medium text-gray-800">
              📌 Pin Question
            </span>
          </label>
          <span className="text-[11px] text-gray-400">
            Never shuffles when question order is randomized
          </span>
        </div>
      </div>

      {/* Explanation for Post-Exam Review */}
      <div className="pt-2 border-t border-gray-100">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
          Explanation / Solution Feedback (Optional)
        </label>
        <Textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          placeholder="Provide an explanation for the correct answer, shown during results review if enabled."
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSaving}
        >
          Save Question
        </Button>
      </div>
    </form>
  )
}
