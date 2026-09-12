import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  EssayGradingForm,
  type EssayItemData,
} from '@/components/admin/grading/EssayGradingForm'
import type { EssayContent } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

interface GradeEssayPageProps {
  params: { id: string; attemptId: string }
}

export async function generateMetadata({
  params,
}: GradeEssayPageProps): Promise<Metadata> {
  return { title: 'Grade Essays — Pariksha' }
}

export default async function GradeEssayPage({ params }: GradeEssayPageProps) {
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
    .select('id, title, teacher_id')
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

  // 3. Fetch essay questions assigned to this attempt
  const assignedIds = attempt.assigned_question_ids || []
  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select('*')
    .in('id', assignedIds)
    .eq('type', 'essay')

  const essayQuestions = questions || []

  // 4. Fetch existing responses for these essay questions
  const { data: responses } = await supabaseAdmin
    .from('responses')
    .select('*')
    .eq('attempt_id', attempt.id)

  const respMap = new Map(responses?.map((r) => [r.question_id, r]) || [])

  const essayItems: EssayItemData[] = essayQuestions.map((q) => {
    const resp = respMap.get(q.id)
    return {
      questionId: q.id,
      prompt: q.prompt,
      points: q.points,
      content: q.content as EssayContent,
      studentAnswer: (resp?.student_answer as string) || '',
      awardedPoints: resp?.awarded_points ?? null,
      teacherComment: resp?.teacher_comment ?? null,
    }
  })

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li>
            <Link
              href="/admin/dashboard"
              className="hover:text-gray-700 transition-colors"
            >
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true" className="text-gray-300">
            /
          </li>
          <li>
            <Link
              href={`/admin/tests/${test.id}/edit`}
              className="hover:text-gray-700 transition-colors truncate max-w-[150px] inline-block align-bottom"
            >
              {test.title}
            </Link>
          </li>
          <li aria-hidden="true" className="text-gray-300">
            /
          </li>
          <li className="text-gray-900 font-medium" aria-current="page">
            Grade: {attempt.student_name}
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Grade Essay Responses
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Review open-ended responses, award score points, and provide constructive feedback.
        </p>
      </div>

      {/* Essay items form */}
      {essayItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-xs text-gray-500">
          This examination does not contain any essay questions.
        </div>
      ) : (
        <EssayGradingForm
          testId={test.id}
          attemptId={attempt.id}
          studentName={attempt.student_name}
          studentIdentifier={attempt.student_identifier}
          attemptStatus={attempt.status}
          currentScore={attempt.score}
          maxScore={attempt.max_score}
          essayItems={essayItems}
        />
      )}
    </div>
  )
}

