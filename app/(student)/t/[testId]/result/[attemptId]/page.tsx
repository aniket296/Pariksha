import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  StudentResultView,
  type ResultQuestionData,
} from '@/components/student/StudentResultView'

export const dynamic = 'force-dynamic'

interface StudentResultPageProps {
  params: { testId: string; attemptId: string }
}

export async function generateMetadata({
  params,
}: StudentResultPageProps): Promise<Metadata> {
  const { data: test } = await supabaseAdmin
    .from('tests')
    .select('title')
    .eq('id', params.testId)
    .single()

  return {
    title: test ? `Result: ${test.title} — Pariksha` : 'Exam Result — Pariksha',
    robots: { index: false, follow: false },
  }
}

export default async function StudentResultPage({
  params,
}: StudentResultPageProps) {
  // 1. Fetch attempt
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('attempts')
    .select('*')
    .eq('id', params.attemptId)
    .single()

  if (attemptError || !attempt) {
    notFound()
  }

  // 2. Fetch test
  const { data: test, error: testError } = await supabaseAdmin
    .from('tests')
    .select('*')
    .eq('id', attempt.test_id)
    .single()

  if (testError || !test) {
    notFound()
  }

  // 3. Fetch questions in assigned order
  const assignedIds = attempt.assigned_question_ids || []
  const { data: questionsData } = await supabaseAdmin
    .from('questions')
    .select('*')
    .in('id', assignedIds)

  const qMap = new Map(questionsData?.map((q) => [q.id, q]) || [])

  // 4. Fetch student responses
  const { data: responsesData } = await supabaseAdmin
    .from('responses')
    .select('*')
    .eq('attempt_id', attempt.id)

  const respMap = new Map(responsesData?.map((r) => [r.question_id, r]) || [])

  // 5. Construct question data respecting reviewConfig permissions
  const questionsList: ResultQuestionData[] = []

  assignedIds.forEach((qId, idx) => {
    const rawQ = qMap.get(qId)
    if (!rawQ) return

    const resp = respMap.get(qId)

    questionsList.push({
      id: rawQ.id,
      order_index: idx,
      type: rawQ.type,
      prompt: rawQ.prompt,
      points: rawQ.points,
      negative_points: rawQ.negative_points,
      explanation: rawQ.explanation,
      content: rawQ.content,
      // Only include grading_key if show_correct_answers is enabled
      ...(test.review_config?.show_correct_answers
        ? { grading_key: rawQ.grading_key }
        : {}),
      student_answer: resp?.student_answer,
      awarded_points: resp?.awarded_points ?? null,
      is_correct: resp?.is_correct ?? null,
      teacher_comment: resp?.teacher_comment ?? null,
    })
  })

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <StudentResultView
        testTitle={test.title}
        testStatus={test.status}
        studentName={attempt.student_name}
        studentIdentifier={attempt.student_identifier}
        startedAt={attempt.started_at}
        submittedAt={attempt.submitted_at}
        attemptStatus={attempt.status}
        score={attempt.score}
        maxScore={attempt.max_score}
        percentage={attempt.percentage}
        isPassed={attempt.is_passed}
        passPercentage={test.pass_percentage}
        passMessage={test.pass_message}
        failMessage={test.fail_message}
        reviewConfig={test.review_config}
        questions={questionsList}
      />
    </div>
  )
}
