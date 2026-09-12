import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import {
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function AttemptStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'submitted':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          Submitted
        </span>
      )
    case 'pending_review':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          Pending Review
        </span>
      )
    case 'in_progress':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          In Progress
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 capitalize">
          {status.replace(/_/g, ' ')}
        </span>
      )
  }
}

interface AttemptDetailPageProps {
  params: { id: string; attemptId: string }
}

export async function generateMetadata({
  params,
}: AttemptDetailPageProps): Promise<Metadata> {
  return { title: 'Attempt Details — Pariksha' }
}

export default async function AttemptDetailPage({ params }: AttemptDetailPageProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // 1. Verify test ownership
  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('id, title, teacher_id, pass_percentage')
    .eq('id', params.id)
    .eq('teacher_id', user.id)
    .single()

  if (testError || !test) {
    notFound()
  }

  // 2. Fetch attempt
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('attempts')
    .select('*')
    .eq('id', params.attemptId)
    .eq('test_id', test.id)
    .single()

  if (attemptError || !attempt) {
    notFound()
  }

  // 3. Fetch cheat logs
  const { data: cheatLogs } = await supabaseAdmin
    .from('cheat_logs')
    .select('*')
    .eq('attempt_id', attempt.id)
    .order('occurred_at', { ascending: true })

  // 4. Fetch assigned questions
  const assignedIds = attempt.assigned_question_ids || []
  let questionsQuery = supabaseAdmin.from('questions').select('*').eq('test_id', test.id)

  if (assignedIds.length > 0) {
    questionsQuery = questionsQuery.in('id', assignedIds)
  }

  const { data: questions } = await questionsQuery.order('order_index', { ascending: true })

  // 5. Fetch student responses
  const { data: responses } = await supabaseAdmin
    .from('responses')
    .select('*')
    .eq('attempt_id', attempt.id)

  const responseMap = new Map((responses || []).map((r) => [r.question_id, r]))

  // Duration calculation
  let durationMinutes: number | null = null
  if (attempt.started_at && attempt.submitted_at) {
    const start = new Date(attempt.started_at).getTime()
    const end = new Date(attempt.submitted_at).getTime()
    durationMinutes = Math.max(1, Math.round((end - start) / 60000))
  }

  const hasEssays = (questions || []).some((q) => q.type === 'essay')

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs text-gray-500">
          <li>
            <Link
              href="/admin/dashboard"
              className="hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
          </li>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <li>
            <Link
              href={`/admin/tests/${test.id}/results`}
              className="hover:text-gray-900 transition-colors truncate max-w-[160px]"
            >
              {test.title} (Results)
            </Link>
          </li>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <li className="text-gray-900 font-medium truncate">
            {attempt.student_name}
          </li>
        </ol>
      </nav>

      {/* Top Banner / Student Attempt Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {attempt.student_name}
            </h1>
            <AttemptStatusBadge status={attempt.status} />
            {attempt.is_passed === true && (
              <Badge variant="green" className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Passed
              </Badge>
            )}
            {attempt.is_passed === false && (
              <Badge variant="red" className="inline-flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Failed
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500 pt-1">
            {attempt.student_identifier && (
              <span>
                Student ID: <strong className="font-mono text-gray-800">{attempt.student_identifier}</strong>
              </span>
            )}
            <span>
              Started: {new Date(attempt.started_at).toLocaleString()}
            </span>
            {attempt.submitted_at && (
              <span>
                Submitted: {new Date(attempt.submitted_at).toLocaleString()}
              </span>
            )}
            {durationMinutes !== null && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {durationMinutes} min
              </span>
            )}
          </div>
        </div>

        {/* Score & Action Button */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Final Score
            </div>
            <div className="text-2xl font-bold text-gray-900 font-mono">
              {attempt.score !== null ? attempt.score : '-'}{' '}
              <span className="text-sm font-normal text-gray-400">/ {attempt.max_score}</span>
            </div>
            <div className="text-xs font-semibold text-brand-600">
              {attempt.percentage !== null ? `${attempt.percentage}%` : 'In progress'}
            </div>
          </div>

          {hasEssays && (
            <Link
              href={`/admin/tests/${test.id}/attempts/${attempt.id}/grade`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Award className="w-4 h-4" />
              Grade Essays
            </Link>
          )}
        </div>
      </div>

      {/* Section 1: Proctoring & Integrity Audit Log */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-gray-700" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Integrity & Proctoring Audit Log
            </h2>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {cheatLogs?.length || 0} Incident{(cheatLogs?.length || 0) === 1 ? '' : 's'} Logged
          </span>
        </div>

        {(!cheatLogs || cheatLogs.length === 0) ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Zero integrity violations recorded. Student completed their exam session without leaving the window or breaking proctoring rules.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-6">Timestamp</th>
                  <th className="py-2.5 px-4">Event Type</th>
                  <th className="py-2.5 px-6">Incident #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cheatLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-6 font-mono text-gray-500 whitespace-nowrap">
                      {new Date(log.occurred_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        {log.event_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-6 text-gray-600 font-mono text-[11px]">
                      Violation count: {log.violation_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 2: Questions & Student Responses Review */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
          Question Responses & Scoring Breakdown ({(questions || []).length})
        </h2>

        {(!questions || questions.length === 0) ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-xs text-gray-400">
            No questions found for this exam attempt.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const resp = responseMap.get(q.id)
              const awarded = resp?.awarded_points ?? null
              const isCorrect = resp?.is_correct ?? null
              const ans = resp?.student_answer

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border p-6 shadow-xs space-y-4 ${
                    isCorrect === true
                      ? 'border-emerald-200'
                      : isCorrect === false
                      ? 'border-rose-200'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-500">
                        Question {idx + 1}
                      </span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {q.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isCorrect === true && (
                        <Badge variant="green" className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Correct
                        </Badge>
                      )}
                      {isCorrect === false && awarded && awarded > 0 && (
                        <Badge variant="amber" className="inline-flex items-center gap-1">
                          Partial Credit
                        </Badge>
                      )}
                      {isCorrect === false && (!awarded || awarded <= 0) && (
                        <Badge variant="red" className="inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Incorrect
                        </Badge>
                      )}
                      {isCorrect === null && (
                        <Badge variant="amber" className="inline-flex items-center gap-1">
                          Pending Review
                        </Badge>
                      )}

                      <span className="font-mono text-xs font-semibold text-gray-900">
                        {awarded !== null ? awarded : '-'}{' '}
                        <span className="text-gray-400 font-normal">/ {q.points} pts</span>
                      </span>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                    {q.prompt}
                  </div>

                  {/* Student Response Display */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/60 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Student&apos;s Answer:
                    </div>

                    {!resp || ans === null || ans === undefined ? (
                      <div className="text-xs italic text-gray-400">
                        No response recorded (unanswered).
                      </div>
                    ) : q.type === 'essay' || q.type === 'fill_blank' ? (
                      <div className="text-xs text-gray-800 whitespace-pre-wrap font-mono bg-white p-3 rounded-lg border border-gray-200">
                        {typeof ans === 'string' ? ans : JSON.stringify(ans)}
                      </div>
                    ) : q.type === 'matching' ? (
                      <div className="text-xs space-y-1">
                        {typeof ans === 'object' && ans !== null ? (
                          Object.entries(ans as Record<string, string>).map(([k, v]) => (
                            <div
                              key={k}
                              className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200"
                            >
                              <span className="font-semibold text-gray-700">{k}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-brand-600 font-medium">{v}</span>
                            </div>
                          ))
                        ) : (
                          <div className="italic text-gray-400">(No pairs matched)</div>
                        )}
                      </div>
                    ) : (
                      // Single, Multi, True/False
                      <div className="text-xs space-y-1">
                        {Array.isArray(ans) && ans.length > 0 ? (
                          ans.map((opt: string) => (
                            <div
                              key={opt}
                              className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 font-medium text-gray-800"
                            >
                              {opt}
                            </div>
                          ))
                        ) : typeof ans === 'string' && ans.length > 0 ? (
                          <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 font-medium text-gray-800">
                            {ans}
                          </div>
                        ) : (
                          <div className="italic text-gray-400">(None selected)</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Official Answer Key */}
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                      Official Grading Key:
                    </div>
                    <div className="text-xs text-blue-950 font-mono">
                      {q.grading_key ? JSON.stringify(q.grading_key) : 'Manual evaluation'}
                    </div>
                    {q.explanation && (
                      <div className="text-xs text-gray-600 pt-1">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>

                  {/* Teacher Comments */}
                  {resp?.teacher_comment && (
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-900">
                      <strong>Teacher Feedback:</strong> {resp.teacher_comment}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Back button */}
      <div className="pt-4">
        <Link
          href={`/admin/tests/${test.id}/results`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Test Results
        </Link>
      </div>
    </div>
  )
}
