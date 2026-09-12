'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  QuestionType,
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

export interface QuestionActionResult {
  error?: string
  success?: boolean
  questionId?: string
}

// ---------------------------------------------------------------------------
// Security Helper: verify teacher ownership of the test
// ---------------------------------------------------------------------------
async function verifyTestOwnership(testId: string) {
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
    .select('id, teacher_id, status')
    .eq('id', testId)
    .eq('teacher_id', user.id)
    .single()

  if (testError || !test) {
    throw new Error('Test not found or access denied')
  }

  return { supabase, user, test }
}

// ---------------------------------------------------------------------------
// Security Helper: verify teacher ownership of a question via test relation
// ---------------------------------------------------------------------------
async function verifyQuestionOwnership(questionId: string) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const { data: question, error: qError } = await supabase
    .from('questions')
    .select('id, test_id')
    .eq('id', questionId)
    .single()

  if (qError || !question) {
    throw new Error('Question not found')
  }

  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('id, teacher_id, status')
    .eq('id', question.test_id)
    .eq('teacher_id', user.id)
    .single()

  if (testError || !test) {
    throw new Error('Access denied')
  }

  return { supabase, user, question, testId: question.test_id }
}

// ---------------------------------------------------------------------------
// Factory for default question content & grading key by type
// ---------------------------------------------------------------------------
function getDefaultContentAndKey(type: QuestionType): {
  content: QuestionContent
  grading_key: GradingKey
} {
  switch (type) {
    case 'mcq_single': {
      const content: McqSingleContent = {
        choices: [
          { id: 'c1', text: 'Option A' },
          { id: 'c2', text: 'Option B' },
          { id: 'c3', text: 'Option C' },
          { id: 'c4', text: 'Option D' },
        ],
      }
      const grading_key: McqSingleGradingKey = {
        correct_choice_id: 'c1',
      }
      return { content, grading_key }
    }
    case 'mcq_multi': {
      const content: McqMultiContent = {
        choices: [
          { id: 'c1', text: 'Option A' },
          { id: 'c2', text: 'Option B' },
          { id: 'c3', text: 'Option C' },
          { id: 'c4', text: 'Option D' },
        ],
      }
      const grading_key: McqMultiGradingKey = {
        correct_choice_ids: ['c1'],
      }
      return { content, grading_key }
    }
    case 'true_false': {
      const content: TrueFalseContent = {
        choices: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
      }
      const grading_key: TrueFalseGradingKey = {
        correct_choice_id: 'true',
      }
      return { content, grading_key }
    }
    case 'fill_blank': {
      const content: FillBlankContent = {
        case_sensitive: false,
      }
      const grading_key: FillBlankGradingKey = {
        accepted_answers: ['Answer'],
      }
      return { content, grading_key }
    }
    case 'essay': {
      const content: EssayContent = {
        min_words: 0,
        max_words: 500,
      }
      const grading_key: EssayGradingKey = {}
      return { content, grading_key }
    }
    case 'matching': {
      const content: MatchingContent = {
        left_items: [
          { id: 'l1', text: 'Item 1' },
          { id: 'l2', text: 'Item 2' },
        ],
        right_items: [
          { id: 'r1', text: 'Match A' },
          { id: 'r2', text: 'Match B' },
        ],
      }
      const grading_key: MatchingGradingKey = {
        pairs: {
          l1: 'r1',
          l2: 'r2',
        },
      }
      return { content, grading_key }
    }
  }
}

// ---------------------------------------------------------------------------
// Action: Create Question
// ---------------------------------------------------------------------------
export async function createQuestionAction(
  testId: string,
  type: QuestionType
): Promise<QuestionActionResult> {
  try {
    const { supabase } = await verifyTestOwnership(testId)

    // Find highest order_index
    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('order_index')
      .eq('test_id', testId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextIndex = existingQuestions && existingQuestions.length > 0
      ? (existingQuestions[0]?.order_index ?? 0) + 1
      : 0

    const { content, grading_key } = getDefaultContentAndKey(type)

    const { data: newQ, error: insertError } = await supabase
      .from('questions')
      .insert({
        test_id: testId,
        type,
        prompt: `New ${type.replace('_', ' ').toUpperCase()} Question`,
        points: 1,
        negative_points: 0,
        is_pinned: false,
        order_index: nextIndex,
        content,
        grading_key,
      })
      .select('id')
      .single()

    if (insertError || !newQ) {
      return { error: 'Failed to create question: ' + insertError?.message }
    }

    revalidatePath(`/admin/tests/${testId}/edit`)
    return { success: true, questionId: newQ.id }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}

// ---------------------------------------------------------------------------
// Action: Update Question
// ---------------------------------------------------------------------------
export interface UpdateQuestionPayload {
  prompt: string
  points: number
  negative_points: number
  is_pinned: boolean
  explanation?: string | null
  content: QuestionContent
  grading_key: GradingKey
}

export async function updateQuestionAction(
  questionId: string,
  payload: UpdateQuestionPayload
): Promise<QuestionActionResult> {
  try {
    const { supabase, testId } = await verifyQuestionOwnership(questionId)

    if (!payload.prompt.trim()) {
      return { error: 'Question prompt cannot be empty.' }
    }
    if (payload.points < 0) {
      return { error: 'Points must be 0 or greater.' }
    }
    if (payload.negative_points < 0) {
      return { error: 'Negative points must be 0 or greater.' }
    }

    const { error: updateError } = await supabase
      .from('questions')
      .update({
        prompt: payload.prompt.trim(),
        points: payload.points,
        negative_points: payload.negative_points,
        is_pinned: payload.is_pinned,
        explanation: payload.explanation?.trim() || null,
        content: payload.content,
        grading_key: payload.grading_key,
      })
      .eq('id', questionId)

    if (updateError) {
      return { error: 'Failed to update question: ' + updateError.message }
    }

    revalidatePath(`/admin/tests/${testId}/edit`)
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}

// ---------------------------------------------------------------------------
// Action: Delete Question
// ---------------------------------------------------------------------------
export async function deleteQuestionAction(
  questionId: string
): Promise<QuestionActionResult> {
  try {
    const { supabase, testId } = await verifyQuestionOwnership(questionId)

    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (deleteError) {
      return { error: 'Failed to delete question: ' + deleteError.message }
    }

    revalidatePath(`/admin/tests/${testId}/edit`)
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}

// ---------------------------------------------------------------------------
// Action: Duplicate Question
// ---------------------------------------------------------------------------
export async function duplicateQuestionAction(
  questionId: string
): Promise<QuestionActionResult> {
  try {
    const { supabase, testId } = await verifyQuestionOwnership(questionId)

    const { data: original, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (fetchError || !original) {
      return { error: 'Could not fetch question to duplicate.' }
    }

    // Insert with bumped order_index
    const { data: duplicated, error: insertError } = await supabase
      .from('questions')
      .insert({
        test_id: testId,
        type: original.type,
        prompt: `${original.prompt} (Copy)`,
        points: original.points,
        negative_points: original.negative_points,
        is_pinned: original.is_pinned,
        order_index: original.order_index + 1,
        content: original.content,
        grading_key: original.grading_key,
        explanation: original.explanation,
      })
      .select('id')
      .single()

    if (insertError || !duplicated) {
      return { error: 'Failed to duplicate question.' }
    }

    revalidatePath(`/admin/tests/${testId}/edit`)
    return { success: true, questionId: duplicated.id }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}

// ---------------------------------------------------------------------------
// Action: Reorder Questions
// ---------------------------------------------------------------------------
export async function reorderQuestionsAction(
  testId: string,
  orderedIds: string[]
): Promise<QuestionActionResult> {
  try {
    const { supabase } = await verifyTestOwnership(testId)

    // Update each question's order_index
    const updates = orderedIds.map((id, index) =>
      supabase
        .from('questions')
        .update({ order_index: index })
        .eq('id', id)
        .eq('test_id', testId)
    )

    await Promise.all(updates)

    revalidatePath(`/admin/tests/${testId}/edit`)
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}

// ---------------------------------------------------------------------------
// Action: Update Test Shuffling & Pool Configuration
// ---------------------------------------------------------------------------
export async function updateShufflingConfigAction(
  testId: string,
  config: {
    shuffle_questions: boolean
    shuffle_options: boolean
    pool_pick_count: number | null
  }
): Promise<QuestionActionResult> {
  try {
    const { supabase } = await verifyTestOwnership(testId)

    if (config.pool_pick_count !== null && config.pool_pick_count < 1) {
      return { error: 'Pool pick count must be at least 1 or empty.' }
    }

    const { error: updateError } = await supabase
      .from('tests')
      .update({
        shuffle_questions: config.shuffle_questions,
        shuffle_options: config.shuffle_options,
        pool_pick_count: config.pool_pick_count,
      })
      .eq('id', testId)

    if (updateError) {
      return { error: 'Failed to update shuffling settings: ' + updateError.message }
    }

    revalidatePath(`/admin/tests/${testId}/edit`)
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}
