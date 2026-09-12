'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { updateShufflingConfigAction } from '@/lib/actions/questions'

interface TestShufflingSettingsProps {
  testId: string
  shuffleQuestions: boolean
  shuffleOptions: boolean
  poolPickCount: number | null
  totalQuestions: number
}

export function TestShufflingSettings({
  testId,
  shuffleQuestions: initialShuffleQ,
  shuffleOptions: initialShuffleOpt,
  poolPickCount: initialPoolPick,
  totalQuestions,
}: TestShufflingSettingsProps) {
  const [shuffleQuestions, setShuffleQuestions] = useState(initialShuffleQ)
  const [shuffleOptions, setShuffleOptions] = useState(initialShuffleOpt)
  const [poolPickCount, setPoolPickCount] = useState<string>(
    initialPoolPick !== null ? String(initialPoolPick) : ''
  )
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    const parsedPool = poolPickCount.trim() === '' ? null : parseInt(poolPickCount)

    try {
      const res = await updateShufflingConfigAction(testId, {
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        pool_pick_count: parsedPool,
      })

      if (res.error) {
        setMessage({ type: 'error', text: res.error })
      } else {
        setMessage({ type: 'success', text: 'Shuffling & pool settings updated.' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update settings',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4"
    >
      <div className="border-b border-gray-100 pb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Shuffling & Question Pool Configuration
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Controls how questions and choices are randomized or sampled for students.
        </p>
      </div>

      {message && (
        <div
          className={`p-2.5 rounded text-xs ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {/* Shuffle Questions */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={shuffleQuestions}
            onChange={(e) => setShuffleQuestions(e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300 mt-0.5 cursor-pointer"
          />
          <div>
            <span className="text-xs font-semibold text-gray-900">
              Shuffle question order
            </span>
            <p className="text-xs text-gray-500">
              Each student gets questions in a randomized order. Questions marked as 📌 Pinned will retain their fixed positions.
            </p>
          </div>
        </label>

        {/* Shuffle Options */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={shuffleOptions}
            onChange={(e) => setShuffleOptions(e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300 mt-0.5 cursor-pointer"
          />
          <div>
            <span className="text-xs font-semibold text-gray-900">
              Shuffle MCQ choice options
            </span>
            <p className="text-xs text-gray-500">
              Randomizes choice order (A, B, C, D) for each student. Individual choices marked as pinned won&apos;t move.
            </p>
          </div>
        </label>

        {/* Pool Pick Count */}
        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-900">
              Question Pool: Randomly pick N questions
            </label>
            <p className="text-xs text-gray-500">
              Leave blank to give all {totalQuestions} questions. If set (e.g. 10), each student is assigned a random subset of 10 questions.
            </p>
          </div>
          <div className="w-32">
            <Input
              type="number"
              min={1}
              max={totalQuestions > 0 ? totalQuestions : undefined}
              value={poolPickCount}
              onChange={(e) => setPoolPickCount(e.target.value)}
              placeholder="All"
            />
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex justify-end">
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          isLoading={isSaving}
        >
          Save Shuffling Settings
        </Button>
      </div>
    </form>
  )
}
