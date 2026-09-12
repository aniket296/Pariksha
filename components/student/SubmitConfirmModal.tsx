'use client'

import { Button } from '@/components/ui/Button'

interface SubmitConfirmModalProps {
  isOpen: boolean
  totalQuestions: number
  answeredCount: number
  unansweredCount: number
  flaggedCount: number
  isSubmitting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function SubmitConfirmModal({
  isOpen,
  totalQuestions,
  answeredCount,
  unansweredCount,
  flaggedCount,
  isSubmitting,
  onConfirm,
  onCancel,
}: SubmitConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 max-w-md w-full space-y-5">
        <div>
          <h2
            id="submit-modal-title"
            className="text-lg font-bold text-gray-900"
          >
            Submit Examination?
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Once submitted, your responses will be locked and you will not be able to change your answers.
          </p>
        </div>

        {/* Breakdown Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
          <div>
            <div className="text-xs text-gray-500 font-medium">Total</div>
            <div className="text-lg font-bold text-gray-900">{totalQuestions}</div>
          </div>
          <div>
            <div className="text-xs text-green-700 font-medium">Answered</div>
            <div className="text-lg font-bold text-green-700">{answeredCount}</div>
          </div>
          <div>
            <div className={`text-xs font-medium ${unansweredCount > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
              Unanswered
            </div>
            <div className={`text-lg font-bold ${unansweredCount > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
              {unansweredCount}
            </div>
          </div>
        </div>

        {/* Warning if unanswered */}
        {unansweredCount > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
            <span className="text-base leading-none">⚠️</span>
            <div>
              You still have <strong>{unansweredCount} unanswered</strong> {unansweredCount === 1 ? 'question' : 'questions'}. Are you sure you want to finish now?
            </div>
          </div>
        )}

        {flaggedCount > 0 && (
          <p className="text-xs text-gray-500">
            📌 You have {flaggedCount} {flaggedCount === 1 ? 'question' : 'questions'} flagged for review.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Return to Exam
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            onClick={onConfirm}
            className="bg-brand-600 hover:bg-brand-700"
          >
            Confirm & Submit
          </Button>
        </div>
      </div>
    </div>
  )
}

