'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { gradeAttempt, regradeTestAttempts } from '@/lib/grading/engine'
import { revalidatePath } from 'next/cache'

export interface GradingActionResult {
  error?: string
  success?: boolean
  message?: string
}

// ---------------------------------------------------------------------------
// Security Helper: verify teacher ownership of test
// ---------------------------------------------------------------------------
async function verifyTeacherOwnership(testId: string) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('id, teacher_id')
    .eq('id', testId)
    .eq('teacher_id', user.id)
    .single()

  if (testError || !test) {
    throw new Error('Test not found or unauthorized')
  }

  return { supabase, user, test }
}

// ---------------------------------------------------------------------------
// Action: Grade an Essay Question Response (Manual Teacher Grading)
// ---------------------------------------------------------------------------
export async function gradeEssayResponseAction(
  testId: string,
  attemptId: string,
  questionId: string,
  awardedPoints: number,
  teacherComment?: string
): Promise<GradingActionResult> {
  try {
    await verifyTeacherOwnership(testId)

    // Fetch question to check maximum points
    const { data: question, error: qError } = await supabaseAdmin
      .from('questions')
      .select('id, points, type')
      .eq('id', questionId)
      .single()

    if (qError || !question) {
      return { error: 'Question not found' }
    }

    if (awardedPoints < 0 || awardedPoints > question.points) {
      return {
        error: `Awarded points must be between 0 and ${question.points}.`,
      }
    }

    // Update response
    const { error: respError } = await supabaseAdmin
      .from('responses')
      .update({
        awarded_points: awardedPoints,
        is_correct: awardedPoints > 0,
        teacher_comment: teacherComment?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('attempt_id', attemptId)
      .eq('question_id', questionId)

    if (respError) {
      return { error: 'Failed to update essay score: ' + respError.message }
    }

    // Recalculate attempt score and check if any other essays remain pending
    await gradeAttempt(attemptId)

    revalidatePath(`/admin/tests/${testId}/attempts`)
    revalidatePath(`/admin/tests/${testId}/attempts/${attemptId}/grade`)

    return { success: true, message: 'Essay score saved and attempt updated.' }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}

// ---------------------------------------------------------------------------
// Action: Regrade All Test Attempts
// ---------------------------------------------------------------------------
export async function regradeAllTestAttemptsAction(
  testId: string
): Promise<GradingActionResult> {
  try {
    await verifyTeacherOwnership(testId)

    const result = await regradeTestAttempts(testId)

    revalidatePath(`/admin/tests/${testId}/attempts`)
    revalidatePath(`/admin/tests/${testId}/results`)

    return {
      success: true,
      message: `Regrading complete. Successfully regraded ${result.regradedCount} student attempt(s).`,
    }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}
