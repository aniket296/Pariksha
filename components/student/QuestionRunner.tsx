'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ExamHeader } from './ExamHeader'
import { QuestionPalette } from './QuestionPalette'
import { SubmitConfirmModal } from './SubmitConfirmModal'
import { Button } from '@/components/ui/Button'
import { useAutosave } from '@/hooks/useAutosave'
import { useExamTimer } from '@/hooks/useExamTimer'
import { submitStudentAttemptAction } from '@/lib/actions/student'
import { McqSingleRunner } from './questions/McqSingleRunner'
import { McqMultiRunner } from './questions/McqMultiRunner'
import { TrueFalseRunner } from './questions/TrueFalseRunner'
import { FillBlankRunner } from './questions/FillBlankRunner'
import { EssayRunner } from './questions/EssayRunner'
import { MatchingRunner } from './questions/MatchingRunner'
import type {
  StudentAttemptState,
  StudentSafeQuestion,
} from '@/lib/actions/student'
import type {
  McqSingleContent,
  McqMultiContent,
  EssayContent,
  MatchingContent,
} from '@/lib/types/database'

interface QuestionRunnerProps {
  initialState: StudentAttemptState
  sessionToken: string
}

export function QuestionRunner({
  initialState,
  sessionToken,
}: QuestionRunnerProps) {
  const router = useRouter()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set())
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [violations, setViolations] = useState(0)
  const [violationAlert, setViolationAlert] = useState<string | null>(null)

  const isSubmittingRef = useRef(false)

  const questions = initialState.questions || []
  const currentQ: StudentSafeQuestion | undefined = questions[currentIdx]

  // Autosave setup
  const { responses, setAnswer, saveStatus } = useAutosave({
    attemptId: initialState.attemptId,
    sessionToken,
    initialResponses: initialState.savedResponses,
  })

  // Final submit handler
  const executeSubmit = useCallback(async () => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await submitStudentAttemptAction(
        initialState.attemptId,
        sessionToken,
        responses
      )

      if (res.error) {
        setSubmitError(res.error)
        setIsSubmitting(false)
        isSubmittingRef.current = false
      } else {
        // Clear local backup
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(`pariksha_backup_${initialState.attemptId}`)
          } catch {
            // ignore
          }
        }
        // Redirect to results / review page
        router.push(
          `/t/${initialState.questions[0]?.id ? 'test' : ''}/result/${initialState.attemptId}`
        )
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
      setIsSubmitting(false)
      isSubmittingRef.current = false
    }
  }, [initialState.attemptId, initialState.questions, responses, router, sessionToken])

  // Timer setup
  const { formattedTime, isUntimed, isWarning, isCritical } = useExamTimer({
    startedAt: initialState.startedAt,
    timeLimitMins: initialState.timeLimitMins,
    onTimeExpired: executeSubmit,
  })

  // Anti-Cheat: Tab Switch & Window Blur Monitoring
  useEffect(() => {
    if (!initialState.antiCheatConfig?.detect_tab_switch) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations((prev) => {
          const count = prev + 1
          setViolationAlert(
            `Warning: Tab switch detected (${count}/${initialState.antiCheatConfig.max_violations}). Stay on this tab to avoid disqualification.`
          )

          if (
            initialState.antiCheatConfig.auto_submit_on_limit &&
            count >= initialState.antiCheatConfig.max_violations
          ) {
            executeSubmit()
          }
          return count
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [executeSubmit, initialState.antiCheatConfig])

  // Anti-Cheat: Clipboard & Context Menu Blocking
  useEffect(() => {
    if (!initialState.antiCheatConfig?.block_clipboard) return

    const blockEvent = (e: Event) => e.preventDefault()

    document.addEventListener('copy', blockEvent)
    document.addEventListener('paste', blockEvent)
    document.addEventListener('cut', blockEvent)
    document.addEventListener('contextmenu', blockEvent)

    return () => {
      document.removeEventListener('copy', blockEvent)
      document.removeEventListener('paste', blockEvent)
      document.removeEventListener('cut', blockEvent)
      document.removeEventListener('contextmenu', blockEvent)
    }
  }, [initialState.antiCheatConfig?.block_clipboard])

  const toggleFlag = (qId: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev)
      if (next.has(qId)) {
        next.delete(qId)
      } else {
        next.add(qId)
      }
      return next
    })
  }

  // Calculate statistics
  const isQuestionAnswered = (qId: string) => {
    const val = responses[qId]
    if (val === undefined || val === null || val === '') return false
    if (Array.isArray(val) && val.length === 0) return false
    if (typeof val === 'object' && Object.keys(val as object).length === 0) return false
    return true
  }

  const answeredCount = questions.filter((q) => isQuestionAnswered(q.id)).length
  const unansweredCount = questions.length - answeredCount

  // Question Input Renderer
  const renderQuestionInput = (q: StudentSafeQuestion) => {
    const val = responses[q.id]

    switch (q.type) {
      case 'mcq_single':
        return (
          <McqSingleRunner
            content={q.content as McqSingleContent}
            value={val as string | undefined}
            onChange={(ans) => setAnswer(q.id, ans)}
            disabled={isSubmitting}
          />
        )
      case 'mcq_multi':
        return (
          <McqMultiRunner
            content={q.content as McqMultiContent}
            value={val as string[] | undefined}
            onChange={(ans) => setAnswer(q.id, ans)}
            disabled={isSubmitting}
          />
        )
      case 'true_false':
        return (
          <TrueFalseRunner
            value={val as 'true' | 'false' | undefined}
            onChange={(ans) => setAnswer(q.id, ans)}
            disabled={isSubmitting}
          />
        )
      case 'fill_blank':
        return (
          <FillBlankRunner
            value={val as string | undefined}
            onChange={(ans) => setAnswer(q.id, ans)}
            disabled={isSubmitting}
          />
        )
      case 'essay':
        return (
          <EssayRunner
            content={q.content as EssayContent}
            value={val as string | undefined}
            onChange={(ans) => setAnswer(q.id, ans)}
            disabled={isSubmitting}
          />
        )
      case 'matching':
        return (
          <MatchingRunner
            content={q.content as MatchingContent}
            value={val as Record<string, string> | undefined}
            onChange={(ans) => setAnswer(q.id, ans)}
            disabled={isSubmitting}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <ExamHeader
        testTitle={initialState.testTitle}
        studentName={initialState.studentName}
        studentIdentifier={initialState.studentIdentifier}
        formattedTime={formattedTime}
        isUntimed={isUntimed}
        isWarning={isWarning}
        isCritical={isCritical}
        saveStatus={saveStatus}
        onSubmitClick={() => setShowSubmitModal(true)}
        isSubmitting={isSubmitting}
      />

      {/* Violation Alert Banner */}
      {violationAlert && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full mt-4">
          <div className="p-3 bg-red-100 border border-red-300 text-red-800 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>🚨</span>
              <span>{violationAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setViolationAlert(null)}
              className="text-red-900 font-bold p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Submit Error Banner */}
      {submitError && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full mt-4">
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {submitError}
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">
        {/* Questions Body */}
        <div className="flex-1 min-w-0 space-y-6">
          {initialState.layoutStyle === 'single_page' ? (
            /* ================= SINGLE PAGE MODE ================= */
            <div className="space-y-6">
              {questions.map((q, idx) => {
                const isFlagged = flaggedIds.has(q.id)
                return (
                  <article
                    key={q.id}
                    id={`question-${idx}`}
                    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          Q{idx + 1}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                          {q.points} {q.points === 1 ? 'pt' : 'pts'}
                        </span>
                        {q.negative_points > 0 && (
                          <span className="text-xs text-red-600">
                            (-{q.negative_points} penalty)
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleFlag(q.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                          isFlagged
                            ? 'bg-amber-100 border-amber-300 text-amber-800 font-semibold'
                            : 'bg-white border-gray-200 text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        {isFlagged ? '📌 Flagged' : 'Flag for review'}
                      </button>
                    </div>

                    {/* Prompt */}
                    <h2 className="text-base font-semibold text-gray-900 leading-relaxed">
                      {q.prompt}
                    </h2>

                    {/* Interactive Answer Input */}
                    <div className="pt-2">{renderQuestionInput(q)}</div>
                  </article>
                )
              })}

              <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  You have reviewed all {questions.length} questions.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setShowSubmitModal(true)}
                  isLoading={isSubmitting}
                >
                  Review & Submit
                </Button>
              </div>
            </div>
          ) : (
            /* ================= ONE-BY-ONE MODE ================= */
            currentQ && (
              <article className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
                {/* Question Header */}
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono px-2.5 py-1 rounded bg-brand-50 text-brand-700">
                      Question {currentIdx + 1} of {questions.length}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {currentQ.points} {currentQ.points === 1 ? 'point' : 'points'}
                    </span>
                    {currentQ.negative_points > 0 && (
                      <span className="text-xs text-red-600">
                        (-{currentQ.negative_points} penalty)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFlag(currentQ.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      flaggedIds.has(currentQ.id)
                        ? 'bg-amber-100 border-amber-300 text-amber-800 font-semibold'
                        : 'bg-white border-gray-200 text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {flaggedIds.has(currentQ.id) ? '📌 Flagged' : 'Flag for review'}
                  </button>
                </div>

                {/* Prompt */}
                <h2 className="text-lg font-semibold text-gray-900 leading-relaxed">
                  {currentQ.prompt}
                </h2>

                {/* Interactive Answer Input */}
                <div className="pt-2">{renderQuestionInput(currentQ)}</div>

                {/* Previous / Next Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  >
                    ← Previous
                  </Button>

                  {currentIdx < questions.length - 1 ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() =>
                        setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))
                      }
                    >
                      Next Question →
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => setShowSubmitModal(true)}
                    >
                      Finish Exam →
                    </Button>
                  )}
                </div>
              </article>
            )
          )}
        </div>

        {/* Sidebar Question Palette */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-20">
            <QuestionPalette
              questions={questions}
              currentIndex={currentIdx}
              responses={responses}
              flaggedIds={flaggedIds}
              onSelectQuestion={(idx) => {
                setCurrentIdx(idx)
                if (initialState.layoutStyle === 'single_page') {
                  const el = document.getElementById(`question-${idx}`)
                  el?.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            />
          </div>
        </aside>
      </main>

      {/* Submit Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={showSubmitModal}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        flaggedCount={flaggedIds.size}
        isSubmitting={isSubmitting}
        onConfirm={executeSubmit}
        onCancel={() => setShowSubmitModal(false)}
      />
    </div>
  )
}

