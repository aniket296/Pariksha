'use client'

import { Button } from '@/components/ui/Button'
import type {
  TestStatus,
  QuestionType,
  QuestionContent,
  GradingKey,
  ReviewConfig,
  McqSingleContent,
  McqSingleGradingKey,
  McqMultiContent,
  McqMultiGradingKey,
  TrueFalseGradingKey,
  FillBlankGradingKey,
  MatchingContent,
  MatchingGradingKey,
} from '@/lib/types/database'

export interface ResultQuestionData {
  id: string
  order_index: number
  type: QuestionType
  prompt: string
  points: number
  negative_points: number
  explanation: string | null
  content: QuestionContent
  grading_key?: GradingKey // Only present if show_correct_answers is true
  student_answer: unknown
  awarded_points: number | null
  is_correct: boolean | null
  teacher_comment: string | null
}

interface StudentResultViewProps {
  testTitle: string
  testStatus: TestStatus
  studentName: string
  studentIdentifier: string | null
  startedAt: string
  submittedAt: string | null
  attemptStatus: string
  score: number | null
  maxScore: number
  percentage: number | null
  isPassed: boolean | null
  passPercentage: number
  passMessage: string | null
  failMessage: string | null
  reviewConfig: ReviewConfig
  questions: ResultQuestionData[]
}

export function StudentResultView({
  testTitle,
  studentName,
  studentIdentifier,
  startedAt,
  submittedAt,
  attemptStatus,
  score,
  maxScore,
  percentage,
  isPassed,
  passPercentage,
  passMessage,
  failMessage,
  reviewConfig,
  questions,
}: StudentResultViewProps) {
  const isPendingReview = attemptStatus === 'pending_review'

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  // Format student answer for display
  const renderStudentAnswer = (q: ResultQuestionData) => {
    const ans = q.student_answer
    if (ans === undefined || ans === null || ans === '') {
      return <span className="text-gray-400 italic">No answer provided</span>
    }

    if (q.type === 'mcq_single') {
      const mcqContent = q.content as McqSingleContent
      const choice = mcqContent.choices?.find((c) => c.id === ans)
      return choice ? choice.text : String(ans)
    }

    if (q.type === 'mcq_multi') {
      const mcqContent = q.content as McqMultiContent
      const selectedIds = Array.isArray(ans) ? ans : [ans]
      const choiceTexts = mcqContent.choices
        ?.filter((c) => selectedIds.includes(c.id))
        ?.map((c) => c.text)
      return choiceTexts && choiceTexts.length > 0
        ? choiceTexts.join(', ')
        : 'None selected'
    }

    if (q.type === 'true_false') {
      return ans === 'true' ? 'True' : 'False'
    }

    if (q.type === 'essay') {
      return (
        <div className="whitespace-pre-wrap font-sans text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
          {String(ans)}
        </div>
      )
    }

    if (q.type === 'matching') {
      const matchContent = q.content as MatchingContent
      const pairs = (ans as Record<string, string>) || {}
      return (
        <div className="space-y-1 text-xs">
          {matchContent.left_items?.map((l) => {
            const targetId = pairs[l.id]
            const target = matchContent.right_items?.find((r) => r.id === targetId)
            return (
              <div key={l.id} className="flex items-center gap-2">
                <span className="font-medium text-gray-700">{l.text}</span>
                <span className="text-gray-400">➔</span>
                <span className="text-gray-900">{target?.text || 'Unmatched'}</span>
              </div>
            )
          })}
        </div>
      )
    }

    return String(ans)
  }

  // Render correct answer if permitted by reviewConfig
  const renderCorrectAnswer = (q: ResultQuestionData) => {
    if (!reviewConfig.show_correct_answers || !q.grading_key) return null

    if (q.type === 'mcq_single') {
      const key = q.grading_key as McqSingleGradingKey
      const mcqContent = q.content as McqSingleContent
      const choice = mcqContent.choices?.find((c) => c.id === key.correct_choice_id)
      return (
        <div className="text-xs text-green-800 bg-green-50 p-2 rounded border border-green-200">
          <strong>Correct Answer:</strong> {choice?.text || key.correct_choice_id}
        </div>
      )
    }

    if (q.type === 'mcq_multi') {
      const key = q.grading_key as McqMultiGradingKey
      const mcqContent = q.content as McqMultiContent
      const correctTexts = mcqContent.choices
        ?.filter((c) => key.correct_choice_ids?.includes(c.id))
        ?.map((c) => c.text)
      return (
        <div className="text-xs text-green-800 bg-green-50 p-2 rounded border border-green-200">
          <strong>Correct Answer(s):</strong> {correctTexts?.join(', ')}
        </div>
      )
    }

    if (q.type === 'true_false') {
      const key = q.grading_key as TrueFalseGradingKey
      return (
        <div className="text-xs text-green-800 bg-green-50 p-2 rounded border border-green-200">
          <strong>Correct Answer:</strong> {key.correct_choice_id === 'true' ? 'True' : 'False'}
        </div>
      )
    }

    if (q.type === 'fill_blank') {
      const key = q.grading_key as FillBlankGradingKey
      return (
        <div className="text-xs text-green-800 bg-green-50 p-2 rounded border border-green-200">
          <strong>Accepted Answer(s):</strong> {key.accepted_answers?.join(' OR ')}
        </div>
      )
    }

    if (q.type === 'matching') {
      const key = q.grading_key as MatchingGradingKey
      const matchContent = q.content as MatchingContent
      return (
        <div className="text-xs text-green-800 bg-green-50 p-2 rounded border border-green-200 space-y-1">
          <strong>Correct Matches:</strong>
          {matchContent.left_items?.map((l) => {
            const correctTargetId = key.pairs?.[l.id]
            const target = matchContent.right_items?.find((r) => r.id === correctTargetId)
            return (
              <div key={l.id} className="flex items-center gap-1.5 pl-2">
                <span>• {l.text}</span>
                <span>➔</span>
                <span className="font-semibold">{target?.text}</span>
              </div>
            )
          })}
        </div>
      )
    }

    return null
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              {testTitle}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Examination Result for <span className="font-semibold text-gray-700">{studentName}</span>
              {studentIdentifier && ` (${studentIdentifier})`}
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="print:hidden gap-1.5 shrink-0"
          >
            <span>🖨️</span>
            Print Result
          </Button>
        </div>

        {/* Pending Teacher Review Callout */}
        {isPendingReview && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs space-y-1">
            <p className="font-bold text-sm">📝 Essay Grading Pending</p>
            <p>
              Your objective questions have been graded. Your essay responses are currently awaiting manual review and grading by your instructor. Your final score will be updated once reviewed.
            </p>
          </div>
        )}

        {/* Score & Pass/Fail Card (if show_score is enabled) */}
        {reviewConfig.show_score ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
              <div>
                <div className="text-xs text-gray-500 font-medium">Score</div>
                <div className="text-xl font-bold text-gray-900">
                  {score ?? '—'} <span className="text-xs text-gray-400 font-normal">/ {maxScore}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Percentage</div>
                <div className="text-xl font-bold text-gray-900">
                  {percentage !== null ? `${percentage}%` : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Passing Threshold</div>
                <div className="text-xl font-bold text-gray-600">
                  {passPercentage}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Status</div>
                <div className="mt-0.5">
                  {isPendingReview ? (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                      Pending
                    </span>
                  ) : isPassed ? (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">
                      PASSED
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                      FAILED
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Pass / Fail Message */}
            {!isPendingReview && isPassed && passMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-900 text-xs">
                {passMessage}
              </div>
            )}
            {!isPendingReview && !isPassed && isPassed !== null && failMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs">
                {failMessage}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
            <p className="text-sm font-semibold text-gray-900">
              Exam Submitted Successfully
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Your responses have been recorded. Score disclosure is disabled for this examination.
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 pt-2 border-t border-gray-100">
          <div>Started: {new Date(startedAt).toLocaleString()}</div>
          {submittedAt && <div>Submitted: {new Date(submittedAt).toLocaleString()}</div>}
        </div>
      </div>

      {/* Per-Question Breakdown (if show_breakdown is enabled) */}
      {reviewConfig.show_breakdown && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900">
            Question Breakdown
          </h2>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isEssay = q.type === 'essay'
              const isCorrect = q.is_correct

              return (
                <article
                  key={q.id}
                  className={`bg-white rounded-xl border p-5 shadow-sm space-y-3 ${
                    isEssay && q.awarded_points === null
                      ? 'border-blue-200'
                      : isCorrect
                      ? 'border-green-200 bg-green-50/10'
                      : 'border-red-200 bg-red-50/10'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        Q{idx + 1}
                      </span>
                      <span className="font-medium capitalize text-gray-500">
                        {q.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="font-bold">
                      {isEssay && q.awarded_points === null ? (
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          Pending Review ({q.points} pts possible)
                        </span>
                      ) : (
                        <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                          {q.awarded_points ?? 0} / {q.points} pts
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Prompt */}
                  <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                    {q.prompt}
                  </h3>

                  {/* Student Answer */}
                  <div className="text-xs space-y-1">
                    <span className="text-gray-500 font-medium block">
                      Your Answer:
                    </span>
                    <div className="text-gray-900 font-medium">
                      {renderStudentAnswer(q)}
                    </div>
                  </div>

                  {/* Teacher Feedback / Comment on Essay */}
                  {q.teacher_comment && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-900">
                      <strong>Teacher Feedback:</strong> {q.teacher_comment}
                    </div>
                  )}

                  {/* Correct Answer Revelation */}
                  {renderCorrectAnswer(q)}

                  {/* Teacher Explanation */}
                  {reviewConfig.show_explanations && q.explanation && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

