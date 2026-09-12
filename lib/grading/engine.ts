import { supabaseAdmin } from '@/lib/supabase/admin'
import type {
  QuestionType,
  QuestionContent,
  GradingKey,
  McqSingleGradingKey,
  McqMultiGradingKey,
  TrueFalseGradingKey,
  FillBlankContent,
  FillBlankGradingKey,
  MatchingGradingKey,
} from '@/lib/types/database'

export interface GradedResponseResult {
  awarded_points: number
  is_correct: boolean | null // null for essay (pending manual review)
}

/**
 * Pure evaluation function for a single student response against a question's grading key.
 *
 * Scoring Rules:
 * - mcq_single: Exact match = full points. Mismatch with penalty = -negative_points.
 * - mcq_multi:
 *     - If student selection exactly matches correct choices = full points.
 *     - Partial credit: (correct_selected / total_correct) * points - (incorrect_selected * penalty).
 * - true_false: Exact match ('true' | 'false') = full points. Mismatch with penalty = -negative_points.
 * - fill_blank: Compares trimmed string against accepted_answers list. Respects case_sensitive flag.
 * - matching: Proportional credit = points * (correct_pairs_count / total_pairs).
 * - essay: Always returns is_correct: null, awarded_points: null (manual grading required).
 */
export function evaluateStudentAnswer(
  type: QuestionType,
  points: number,
  negativePoints: number,
  content: QuestionContent,
  gradingKey: GradingKey,
  studentAnswer: unknown
): GradedResponseResult {
  // If student did not answer
  if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
    // Unanswered objective questions get 0 points (no negative penalty for skipping)
    if (type === 'essay') {
      return { awarded_points: 0, is_correct: false }
    }
    return { awarded_points: 0, is_correct: false }
  }

  switch (type) {
    case 'mcq_single': {
      const key = gradingKey as McqSingleGradingKey
      const isCorrect = String(studentAnswer) === String(key.correct_choice_id)
      const awarded = isCorrect ? points : -Math.abs(negativePoints)
      return {
        is_correct: isCorrect,
        awarded_points: awarded,
      }
    }

    case 'mcq_multi': {
      const key = gradingKey as McqMultiGradingKey
      const correctSet = new Set(key.correct_choice_ids || [])
      const studentList = Array.isArray(studentAnswer)
        ? (studentAnswer as string[])
        : [String(studentAnswer)]
      const studentSet = new Set(studentList)

      if (correctSet.size === 0) {
        return { is_correct: false, awarded_points: 0 }
      }

      // Exact match
      const isExact =
        studentSet.size === correctSet.size &&
        [...studentSet].every((val) => correctSet.has(val))

      if (isExact) {
        return { is_correct: true, awarded_points: points }
      }

      // Partial credit calculation
      let correctSelected = 0
      let incorrectSelected = 0

      studentSet.forEach((val) => {
        if (correctSet.has(val)) {
          correctSelected++
        } else {
          incorrectSelected++
        }
      })

      const fraction = correctSelected / correctSet.size
      let awarded = fraction * points

      if (incorrectSelected > 0 && negativePoints > 0) {
        awarded -= incorrectSelected * negativePoints
      }

      // Round to 2 decimal places
      awarded = Math.round(awarded * 100) / 100

      return {
        is_correct: awarded > 0,
        awarded_points: awarded,
      }
    }

    case 'true_false': {
      const key = gradingKey as TrueFalseGradingKey
      const isCorrect = String(studentAnswer) === String(key.correct_choice_id)
      const awarded = isCorrect ? points : -Math.abs(negativePoints)
      return {
        is_correct: isCorrect,
        awarded_points: awarded,
      }
    }

    case 'fill_blank': {
      const key = gradingKey as FillBlankGradingKey
      const fillContent = content as FillBlankContent
      const studentStr = String(studentAnswer).trim()
      const accepted = key.accepted_answers || []

      const isMatch = accepted.some((ans) => {
        if (fillContent.case_sensitive) {
          return ans.trim() === studentStr
        }
        return ans.trim().toLowerCase() === studentStr.toLowerCase()
      })

      const awarded = isMatch ? points : -Math.abs(negativePoints)
      return {
        is_correct: isMatch,
        awarded_points: awarded,
      }
    }

    case 'matching': {
      const key = gradingKey as MatchingGradingKey
      const correctPairs = key.pairs || {}
      const totalPairs = Object.keys(correctPairs).length

      if (totalPairs === 0) {
        return { is_correct: false, awarded_points: 0 }
      }

      const studentPairs =
        typeof studentAnswer === 'object' && studentAnswer !== null
          ? (studentAnswer as Record<string, string>)
          : {}

      let matchedCount = 0
      Object.entries(correctPairs).forEach(([leftId, targetId]) => {
        if (studentPairs[leftId] === targetId) {
          matchedCount++
        }
      })

      const isAllCorrect = matchedCount === totalPairs
      const partialPoints =
        Math.round((matchedCount / totalPairs) * points * 100) / 100

      return {
        is_correct: isAllCorrect,
        awarded_points: partialPoints,
      }
    }

    case 'essay': {
      // Manual grading required by teacher
      return {
        is_correct: null,
        awarded_points: 0,
      }
    }
  }
}

/**
 * Grades all responses for an attempt and computes overall score, percentage, and pass/fail.
 */
export async function gradeAttempt(attemptId: string) {
  // 1. Fetch attempt and test
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('attempts')
    .select('*')
    .eq('id', attemptId)
    .single()

  if (attemptError || !attempt) {
    throw new Error('Attempt not found')
  }

  const { data: test, error: testError } = await supabaseAdmin
    .from('tests')
    .select('*')
    .eq('id', attempt.test_id)
    .single()

  if (testError || !test) {
    throw new Error('Test not found')
  }

  // 2. Fetch all questions for this test
  const assignedIds = attempt.assigned_question_ids || []
  if (assignedIds.length === 0) return

  const { data: questions, error: qError } = await supabaseAdmin
    .from('questions')
    .select('*')
    .in('id', assignedIds)

  if (qError || !questions) {
    throw new Error('Failed to fetch questions for grading')
  }

  const questionMap = new Map(questions.map((q) => [q.id, q]))

  // 3. Fetch existing student responses
  const { data: responses } = await supabaseAdmin
    .from('responses')
    .select('*')
    .eq('attempt_id', attemptId)

  const responseMap = new Map(responses?.map((r) => [r.question_id, r]) || [])

  let hasPendingEssay = false
  let totalScore = 0
  const responseUpdates: Array<{
    attempt_id: string
    question_id: string
    student_answer: unknown
    awarded_points: number | null
    is_correct: boolean | null
    updated_at: string
  }> = []

  assignedIds.forEach((qId) => {
    const q = questionMap.get(qId)
    if (!q) return

    const resp = responseMap.get(qId)
    const studentAnswer = resp?.student_answer

    if (q.type === 'essay') {
      // If teacher has already graded this essay (awarded_points is not null and is_correct is not null)
      if (resp && resp.is_correct !== null && resp.awarded_points !== null) {
        totalScore += resp.awarded_points
      } else {
        hasPendingEssay = true
        // Keep pending
        responseUpdates.push({
          attempt_id: attemptId,
          question_id: qId,
          student_answer: studentAnswer ?? null,
          awarded_points: null,
          is_correct: null,
          updated_at: new Date().toISOString(),
        })
      }
    } else {
      const evalResult = evaluateStudentAnswer(
        q.type,
        q.points,
        q.negative_points,
        q.content,
        q.grading_key,
        studentAnswer
      )

      totalScore += evalResult.awarded_points

      responseUpdates.push({
        attempt_id: attemptId,
        question_id: qId,
        student_answer: studentAnswer ?? null,
        awarded_points: evalResult.awarded_points,
        is_correct: evalResult.is_correct,
        updated_at: new Date().toISOString(),
      })
    }
  })

  // Upsert all graded responses
  if (responseUpdates.length > 0) {
    await supabaseAdmin
      .from('responses')
      .upsert(responseUpdates, { onConflict: 'attempt_id,question_id' })
  }

  // Ensure total score does not drop below 0
  const finalScore = Math.max(0, Math.round(totalScore * 100) / 100)
  const maxScore = attempt.max_score > 0 ? attempt.max_score : 1
  const percentage = Math.round((finalScore / maxScore) * 1000) / 10 // e.g. 85.5%
  const isPassed = percentage >= test.pass_percentage

  const status = hasPendingEssay ? 'pending_review' : 'submitted'

  // Update attempt
  await supabaseAdmin
    .from('attempts')
    .update({
      score: finalScore,
      percentage,
      is_passed: isPassed,
      status,
      submitted_at: attempt.submitted_at || new Date().toISOString(),
    })
    .eq('id', attemptId)

  return {
    score: finalScore,
    percentage,
    isPassed,
    status,
    hasPendingEssay,
  }
}

/**
 * Regrades all attempts for a given test (or specific question) when a teacher modifies an answer key.
 */
export async function regradeTestAttempts(testId: string, _questionId?: string) {
  // Fetch all completed/pending attempts for this test
  const { data: attempts, error } = await supabaseAdmin
    .from('attempts')
    .select('id')
    .eq('test_id', testId)
    .in('status', ['submitted', 'pending_review'])

  if (error || !attempts) {
    throw new Error('Failed to fetch attempts for regrading')
  }

  // Regrade each attempt
  for (const a of attempts) {
    await gradeAttempt(a.id)
  }

  return { regradedCount: attempts.length }
}
