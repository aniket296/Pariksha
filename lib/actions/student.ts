'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import type {
  QuestionType,
  QuestionContent,
  Choice,
  MatchingContent,
} from '@/lib/types/database'

export interface StudentSafeQuestion {
  id: string
  order_index: number
  type: QuestionType
  prompt: string
  points: number
  negative_points: number
  content: QuestionContent
}

export interface VerifyAndStartResult {
  error?: string
  attemptId?: string
  sessionToken?: string
}

export interface StudentAttemptState {
  attemptId: string
  testTitle: string
  testDescription: string | null
  timeLimitMins: number
  layoutStyle: 'single_page' | 'one_by_one'
  startedAt: string
  expiresAt: string | null
  remainingSeconds: number | null
  studentName: string
  studentIdentifier: string | null
  questions: StudentSafeQuestion[]
  savedResponses: Record<string, unknown>
  antiCheatConfig: {
    detect_tab_switch: boolean
    enforce_fullscreen: boolean
    block_clipboard: boolean
    max_violations: number
    auto_submit_on_limit: boolean
    allow_resume: boolean
  }
}

// ---------------------------------------------------------------------------
// Helper: Array shuffle (Fisher-Yates)
// ---------------------------------------------------------------------------
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]!
    result[i] = result[j]!
    result[j] = temp
  }
  return result
}

// ---------------------------------------------------------------------------
// Action: Verify Student Access & Start/Resume Attempt
// ---------------------------------------------------------------------------
export async function verifyAndStartAttemptAction(
  testId: string,
  formData: {
    name: string
    identifier?: string
    passcode?: string
  }
): Promise<VerifyAndStartResult> {
  const name = formData.name.trim()
  const identifier = formData.identifier?.trim() || null
  const passcode = formData.passcode?.trim() || null

  if (!name) {
    return { error: 'Please enter your name.' }
  }

  // 1. Fetch test
  const { data: test, error: testError } = await supabaseAdmin
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single()

  if (testError || !test) {
    return { error: 'Test not found.' }
  }

  if (test.status !== 'published') {
    return { error: 'This test is currently not published or open for submissions.' }
  }

  // 2. Check schedule availability
  const now = Date.now()
  if (test.open_at && new Date(test.open_at).getTime() > now) {
    return {
      error: `This exam has not opened yet. It will open on ${new Date(
        test.open_at
      ).toLocaleString()}.`,
    }
  }
  if (test.close_at && new Date(test.close_at).getTime() < now) {
    return { error: 'This exam has closed and is no longer accepting attempts.' }
  }

  // 3. Verify access requirements
  if (test.access_type === 'name_and_id' && !identifier) {
    return { error: 'Please enter your Student ID / Roll Number.' }
  }

  if (test.access_type === 'whitelist') {
    const roster = test.whitelist_data || []
    const match = roster.some((entry) => {
      const nameMatch = entry.name.toLowerCase() === name.toLowerCase()
      if (entry.identifier && identifier) {
        return nameMatch && entry.identifier.toLowerCase() === identifier.toLowerCase()
      }
      return nameMatch
    })

    if (!match) {
      return {
        error:
          'Your details were not found on the approved student roster. Please check your spelling or contact your teacher.',
      }
    }
  }

  // 4. Verify passcode if required
  if (test.passcode) {
    if (!passcode || passcode !== test.passcode) {
      return { error: 'Incorrect exam passcode.' }
    }
  }

  // 5. Check existing attempts & resume capability
  let query = supabaseAdmin
    .from('attempts')
    .select('id, status, session_token, started_at')
    .eq('test_id', testId)
    .ilike('student_name', name)

  if (identifier) {
    query = query.eq('student_identifier', identifier)
  }

  const { data: existingAttempts } = await query

  const inProgressAttempt = existingAttempts?.find((a) => a.status === 'in_progress')

  // Resume existing in_progress attempt if allowed
  if (inProgressAttempt) {
    if (test.anti_cheat_config?.allow_resume) {
      return {
        attemptId: inProgressAttempt.id,
        sessionToken: inProgressAttempt.session_token || undefined,
      }
    } else {
      return {
        error:
          'You already have an exam attempt in progress, and session resuming is disabled for this test.',
      }
    }
  }

  // Check max attempts
  if (test.max_attempts > 0 && existingAttempts) {
    const finishedCount = existingAttempts.filter(
      (a) => a.status !== 'in_progress'
    ).length
    if (finishedCount >= test.max_attempts) {
      return {
        error: `You have reached the maximum allowed attempts (${test.max_attempts}) for this exam.`,
      }
    }
  }

  // 6. Fetch questions for attempt generation
  const { data: allQuestions, error: qError } = await supabaseAdmin
    .from('questions')
    .select('id, order_index, is_pinned, points')
    .eq('test_id', testId)
    .order('order_index', { ascending: true })

  if (qError || !allQuestions || allQuestions.length === 0) {
    return { error: 'No questions are available in this test.' }
  }

  // Calculate assigned questions (Pool selection & Shuffling)
  let selectedQuestions = [...allQuestions]

  // If pool_pick_count is set, sample N questions (keeping pinned ones)
  if (test.pool_pick_count && test.pool_pick_count < allQuestions.length) {
    const pinned = allQuestions.filter((q) => q.is_pinned)
    const unpinned = allQuestions.filter((q) => !q.is_pinned)
    const needed = Math.max(0, test.pool_pick_count - pinned.length)
    const sampledUnpinned = shuffleArray(unpinned).slice(0, needed)
    selectedQuestions = [...pinned, ...sampledUnpinned]
  }

  // If shuffle_questions is enabled, shuffle unpinned questions
  if (test.shuffle_questions) {
    const pinnedMap = new Map<number, typeof allQuestions[0]>()
    const unpinnedList: typeof allQuestions = []

    selectedQuestions.forEach((q) => {
      if (q.is_pinned) {
        pinnedMap.set(q.order_index, q)
      } else {
        unpinnedList.push(q)
      }
    })

    const shuffledUnpinned = shuffleArray(unpinnedList)
    let unpinnedIdx = 0

    // Construct final list preserving pinned positions
    const finalOrdered: typeof allQuestions = []
    const totalCount = selectedQuestions.length

    for (let i = 0; i < totalCount; i++) {
      if (pinnedMap.has(i)) {
        finalOrdered.push(pinnedMap.get(i)!)
      } else if (unpinnedIdx < shuffledUnpinned.length) {
        finalOrdered.push(shuffledUnpinned[unpinnedIdx]!)
        unpinnedIdx++
      }
    }

    // Append any remaining
    while (unpinnedIdx < shuffledUnpinned.length) {
      finalOrdered.push(shuffledUnpinned[unpinnedIdx]!)
      unpinnedIdx++
    }

    selectedQuestions = finalOrdered
  }

  const assignedQuestionIds = selectedQuestions.map((q) => q.id)
  const maxScore = selectedQuestions.reduce((acc, q) => acc + q.points, 0)
  const sessionToken = crypto.randomUUID()

  // 7. Create attempt record
  const { data: newAttempt, error: insertError } = await supabaseAdmin
    .from('attempts')
    .insert({
      test_id: testId,
      student_name: name,
      student_identifier: identifier,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      max_score: maxScore,
      assigned_question_ids: assignedQuestionIds,
      session_token: sessionToken,
    })
    .select('id')
    .single()

  if (insertError || !newAttempt) {
    return { error: 'Failed to initialize exam session. Please try again.' }
  }

  return {
    attemptId: newAttempt.id,
    sessionToken,
  }
}

// ---------------------------------------------------------------------------
// Action: Load Attempt State for Question Runner
// (STRICT: Strips grading_key and explanation from questions)
// ---------------------------------------------------------------------------
export async function getStudentAttemptStateAction(
  attemptId: string,
  sessionToken: string
): Promise<{ error?: string; state?: StudentAttemptState }> {
  // Verify attempt and token
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('attempts')
    .select('*')
    .eq('id', attemptId)
    .single()

  if (attemptError || !attempt) {
    return { error: 'Exam attempt not found.' }
  }

  if (attempt.session_token !== sessionToken) {
    return { error: 'Unauthorized session token. Please re-enter the exam.' }
  }

  if (attempt.status !== 'in_progress') {
    return { error: `This exam attempt has already been ${attempt.status}.` }
  }

  // Fetch test
  const { data: test, error: testError } = await supabaseAdmin
    .from('tests')
    .select('*')
    .eq('id', attempt.test_id)
    .single()

  if (testError || !test) {
    return { error: 'Test not found.' }
  }

  // Calculate timer
  let expiresAt: string | null = null
  let remainingSeconds: number | null = null

  if (test.time_limit_mins > 0) {
    const startMs = new Date(attempt.started_at).getTime()
    const limitMs = test.time_limit_mins * 60 * 1000
    const endMs = startMs + limitMs
    expiresAt = new Date(endMs).toISOString()
    const diffSec = Math.floor((endMs - Date.now()) / 1000)
    remainingSeconds = Math.max(0, diffSec)
  }

  // Fetch assigned questions in exact assigned order
  const assignedIds = attempt.assigned_question_ids || []
  if (assignedIds.length === 0) {
    return { error: 'No questions assigned to this attempt.' }
  }

  const { data: questionsData, error: qError } = await supabaseAdmin
    .from('questions')
    .select('id, type, prompt, points, negative_points, content')
    .in('id', assignedIds)

  if (qError || !questionsData) {
    return { error: 'Failed to load exam questions.' }
  }

  // Re-order questions according to assigned_question_ids
  const qMap = new Map(questionsData.map((q) => [q.id, q]))
  const orderedQuestions: StudentSafeQuestion[] = []

  assignedIds.forEach((id, index) => {
    const rawQ = qMap.get(id)
    if (!rawQ) return

    let content = rawQ.content as QuestionContent

    // If shuffle_options is enabled, randomize choices for MCQ
    if (test.shuffle_options) {
      if (rawQ.type === 'mcq_single' || rawQ.type === 'mcq_multi') {
        const mcqContent = content as { choices: Choice[] }
        if (mcqContent.choices) {
          const pinnedChoices = mcqContent.choices.filter((c) => c.pinned)
          const unpinnedChoices = mcqContent.choices.filter((c) => !c.pinned)
          content = {
            choices: [...shuffleArray(unpinnedChoices), ...pinnedChoices],
          } as QuestionContent
        }
      } else if (rawQ.type === 'matching') {
        const matchContent = content as MatchingContent
        if (matchContent.right_items) {
          content = {
            ...matchContent,
            right_items: shuffleArray(matchContent.right_items),
          } as QuestionContent
        }
      }
    }

    orderedQuestions.push({
      id: rawQ.id,
      order_index: index,
      type: rawQ.type,
      prompt: rawQ.prompt,
      points: rawQ.points,
      negative_points: rawQ.negative_points,
      content,
    })
  })

  // Fetch saved responses
  const { data: responses } = await supabaseAdmin
    .from('responses')
    .select('question_id, student_answer')
    .eq('attempt_id', attemptId)

  const savedResponses: Record<string, unknown> = {}
  responses?.forEach((r) => {
    savedResponses[r.question_id] = r.student_answer
  })

  return {
    state: {
      attemptId: attempt.id,
      testTitle: test.title,
      testDescription: test.description,
      timeLimitMins: test.time_limit_mins,
      layoutStyle: test.layout_style,
      startedAt: attempt.started_at,
      expiresAt,
      remainingSeconds,
      studentName: attempt.student_name,
      studentIdentifier: attempt.student_identifier,
      questions: orderedQuestions,
      savedResponses,
      antiCheatConfig: test.anti_cheat_config,
    },
  }
}

// ---------------------------------------------------------------------------
// Action: Save Individual Answer (Autosave endpoint)
// ---------------------------------------------------------------------------
export async function saveStudentResponseAction(
  attemptId: string,
  sessionToken: string,
  questionId: string,
  studentAnswer: unknown
): Promise<{ error?: string; success?: boolean }> {
  // Validate attempt and token
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('attempts')
    .select('id, status, session_token')
    .eq('id', attemptId)
    .single()

  if (attemptError || !attempt) {
    return { error: 'Attempt not found.' }
  }

  if (attempt.session_token !== sessionToken) {
    return { error: 'Invalid session token.' }
  }

  if (attempt.status !== 'in_progress') {
    return { error: 'Attempt is no longer in progress.' }
  }

  // Upsert response using UNIQUE(attempt_id, question_id)
  const { error: upsertError } = await supabaseAdmin
    .from('responses')
    .upsert(
      {
        attempt_id: attemptId,
        question_id: questionId,
        student_answer: studentAnswer,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'attempt_id,question_id' }
    )

  if (upsertError) {
    return { error: 'Failed to save response: ' + upsertError.message }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// Action: Submit Attempt
// ---------------------------------------------------------------------------
export async function submitStudentAttemptAction(
  attemptId: string,
  sessionToken: string,
  finalResponses?: Record<string, unknown>
): Promise<{ error?: string; success?: boolean }> {
  // Validate attempt and token
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('attempts')
    .select('id, test_id, status, session_token, started_at')
    .eq('id', attemptId)
    .single()

  if (attemptError || !attempt) {
    return { error: 'Attempt not found.' }
  }

  if (attempt.session_token !== sessionToken) {
    return { error: 'Unauthorized session.' }
  }

  if (attempt.status !== 'in_progress') {
    return { success: true } // Already submitted
  }

  // Save any final responses passed at submit time
  if (finalResponses && Object.keys(finalResponses).length > 0) {
    const upserts = Object.entries(finalResponses).map(([qId, ans]) => ({
      attempt_id: attemptId,
      question_id: qId,
      student_answer: ans,
      updated_at: new Date().toISOString(),
    }))

    await supabaseAdmin
      .from('responses')
      .upsert(upserts, { onConflict: 'attempt_id,question_id' })
  }

  // Authoritative grading via grading engine
  try {
    const { gradeAttempt } = await import('@/lib/grading/engine')
    await gradeAttempt(attemptId)
  } catch (err: unknown) {
    console.error('[Submit] Grading error:', err)
    // Fallback: still mark submitted so attempt is not stuck in_progress
    await supabaseAdmin
      .from('attempts')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
  }

  return { success: true }
}

