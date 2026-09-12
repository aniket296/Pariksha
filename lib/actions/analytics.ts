'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { gradeAttempt } from '@/lib/grading/engine'
import { revalidatePath } from 'next/cache'

export interface TestSummaryStats {
  totalAttempts: number
  inProgressCount: number
  submittedCount: number
  pendingReviewCount: number
  averageScore: number
  averagePercentage: number
  highestScore: number
  lowestScore: number
  medianPercentage: number
  passRate: number
  maxPossibleScore: number
}

export interface ScoreBin {
  range: string
  count: number
  percentage: number
}

export interface QuestionAnalysis {
  questionId: string
  orderIndex: number
  type: string
  prompt: string
  maxPoints: number
  averageScore: number
  correctPercentage: number
  difficulty: 'Easy' | 'Moderate' | 'Hard'
}

export interface AttemptListItem {
  id: string
  studentName: string
  studentIdentifier: string | null
  status: string
  score: number | null
  maxScore: number
  percentage: number | null
  isPassed: boolean | null
  startedAt: string
  submittedAt: string | null
  durationMinutes: number | null
  cheatEventCount: number
}

// ---------------------------------------------------------------------------
// Security Helper: verify teacher ownership
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
    .select('id, title, teacher_id, pass_percentage')
    .eq('id', testId)
    .eq('teacher_id', user.id)
    .single()

  if (testError || !test) {
    throw new Error('Test not found or unauthorized')
  }

  return { supabase, user, test }
}

// ---------------------------------------------------------------------------
// Query: Fetch Complete Analytics & Item Analysis
// ---------------------------------------------------------------------------
export async function getTestAnalytics(testId: string): Promise<{
  error?: string
  stats?: TestSummaryStats
  distribution?: ScoreBin[]
  itemAnalysis?: QuestionAnalysis[]
  attempts?: AttemptListItem[]
}> {
  try {
    const { test } = await verifyTeacherOwnership(testId)

    // 1. Fetch all attempts
    const { data: attemptsData, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .select('*')
      .eq('test_id', testId)
      .order('started_at', { ascending: false })

    if (attemptsError || !attemptsData) {
      return { error: 'Failed to fetch test attempts: ' + attemptsError?.message }
    }

    // 2. Fetch cheat logs count for all attempts
    const attemptIds = attemptsData.map((a) => a.id)
    const cheatCounts: Record<string, number> = {}

    if (attemptIds.length > 0) {
      const { data: logs } = await supabaseAdmin
        .from('cheat_logs')
        .select('attempt_id')
        .in('attempt_id', attemptIds)

      logs?.forEach((l) => {
        cheatCounts[l.attempt_id] = (cheatCounts[l.attempt_id] || 0) + 1
      })
    }

    // Format attempts list
    const attemptsList: AttemptListItem[] = attemptsData.map((a) => {
      let durationMinutes: number | null = null
      if (a.started_at && a.submitted_at) {
        const start = new Date(a.started_at).getTime()
        const end = new Date(a.submitted_at).getTime()
        durationMinutes = Math.max(1, Math.round((end - start) / 60000))
      }

      return {
        id: a.id,
        studentName: a.student_name,
        studentIdentifier: a.student_identifier,
        status: a.status,
        score: a.score,
        maxScore: a.max_score,
        percentage: a.percentage,
        isPassed: a.is_passed,
        startedAt: a.started_at,
        submittedAt: a.submitted_at,
        durationMinutes,
        cheatEventCount: cheatCounts[a.id] || 0,
      }
    })

    // Filter completed/scored attempts for metrics
    const completed = attemptsData.filter(
      (a) => a.status === 'submitted' || a.status === 'pending_review'
    )

    const inProgressCount = attemptsData.filter((a) => a.status === 'in_progress').length
    const pendingReviewCount = attemptsData.filter((a) => a.status === 'pending_review').length
    const submittedCount = attemptsData.filter((a) => a.status === 'submitted').length

    // Compute Summary Stats
    const scores = completed.map((a) => a.score ?? 0)
    const percentages = completed.map((a) => a.percentage ?? 0)
    const passedCount = completed.filter((a) => a.is_passed === true).length

    const totalAttempts = attemptsData.length
    const completedCount = completed.length

    const avgScore =
      completedCount > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / completedCount) * 10) / 10
        : 0
    const avgPct =
      completedCount > 0
        ? Math.round((percentages.reduce((a, b) => a + b, 0) / completedCount) * 10) / 10
        : 0
    const highestScore = completedCount > 0 ? Math.max(...scores) : 0
    const lowestScore = completedCount > 0 ? Math.min(...scores) : 0

    // Median percentage
    let medianPct = 0
    if (completedCount > 0) {
      const sortedPct = [...percentages].sort((a, b) => a - b)
      const mid = Math.floor(sortedPct.length / 2)
      medianPct =
        sortedPct.length % 2 !== 0
          ? sortedPct[mid]!
          : Math.round(((sortedPct[mid - 1]! + sortedPct[mid]!) / 2) * 10) / 10
    }

    const passRate =
      completedCount > 0 ? Math.round((passedCount / completedCount) * 1000) / 10 : 0
    const maxScore = completed[0]?.max_score || 0

    const stats: TestSummaryStats = {
      totalAttempts,
      inProgressCount,
      submittedCount,
      pendingReviewCount,
      averageScore: avgScore,
      averagePercentage: avgPct,
      highestScore,
      lowestScore,
      medianPercentage: medianPct,
      passRate,
      maxPossibleScore: maxScore,
    }

    // Compute Score Distribution Bins (0-20%, 21-40%, 41-60%, 61-80%, 81-100%)
    const bins = [
      { range: '0 - 20%', min: 0, max: 20, count: 0 },
      { range: '21 - 40%', min: 21, max: 40, count: 0 },
      { range: '41 - 60%', min: 41, max: 60, count: 0 },
      { range: '61 - 80%', min: 61, max: 80, count: 0 },
      { range: '81 - 100%', min: 81, max: 100, count: 0 },
    ]

    percentages.forEach((pct) => {
      const bin = bins.find((b) => pct >= b.min && pct <= b.max)
      if (bin) {
        bin.count++
      } else if (pct > 100) {
        bins[4]!.count++
      }
    })

    const distribution: ScoreBin[] = bins.map((b) => ({
      range: b.range,
      count: b.count,
      percentage:
        completedCount > 0 ? Math.round((b.count / completedCount) * 100) : 0,
    }))

    // 3. Item Analysis
    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id, order_index, type, prompt, points')
      .eq('test_id', testId)
      .order('order_index', { ascending: true })

    const itemAnalysis: QuestionAnalysis[] = []

    if (questions && questions.length > 0 && attemptIds.length > 0) {
      // Fetch responses for these attempts
      const { data: allResponses } = await supabaseAdmin
        .from('responses')
        .select('question_id, awarded_points, is_correct')
        .in('attempt_id', attemptIds)

      const questionResponsesMap: Record<
        string,
        Array<{ awarded_points: number | null; is_correct: boolean | null }>
      > = {}

      allResponses?.forEach((r) => {
        if (!questionResponsesMap[r.question_id]) {
          questionResponsesMap[r.question_id] = []
        }
        questionResponsesMap[r.question_id]!.push(r)
      })

      questions.forEach((q) => {
        const resps = questionResponsesMap[q.id] || []
        const count = resps.length

        let avgPoints = 0
        let correctRatio = 0

        if (count > 0) {
          const totalPointsEarned = resps.reduce(
            (acc, r) => acc + (r.awarded_points || 0),
            0
          )
          avgPoints = Math.round((totalPointsEarned / count) * 10) / 10

          const correctCount = resps.filter((r) => r.is_correct === true).length
          correctRatio = Math.round((correctCount / count) * 100)
        }

        let difficulty: 'Easy' | 'Moderate' | 'Hard' = 'Moderate'
        if (correctRatio >= 80) {
          difficulty = 'Easy'
        } else if (correctRatio < 40) {
          difficulty = 'Hard'
        }

        itemAnalysis.push({
          questionId: q.id,
          orderIndex: q.order_index,
          type: q.type,
          prompt: q.prompt,
          maxPoints: q.points,
          averageScore: avgPoints,
          correctPercentage: correctRatio,
          difficulty,
        })
      })
    }

    return {
      stats,
      distribution,
      itemAnalysis,
      attempts: attemptsList,
    }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}

// ---------------------------------------------------------------------------
// Action: Force Submit in_progress Attempt
// ---------------------------------------------------------------------------
export async function forceSubmitAttemptAction(
  testId: string,
  attemptId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await verifyTeacherOwnership(testId)

    await gradeAttempt(attemptId)

    revalidatePath(`/admin/tests/${testId}/results`)
    revalidatePath(`/admin/tests/${testId}/monitor`)

    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}

// ---------------------------------------------------------------------------
// Action: Delete / Void Attempt
// ---------------------------------------------------------------------------
export async function deleteAttemptAction(
  testId: string,
  attemptId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await verifyTeacherOwnership(testId)

    // Delete responses & cheat logs cascade via FK or explicit
    await supabaseAdmin.from('cheat_logs').delete().eq('attempt_id', attemptId)
    await supabaseAdmin.from('responses').delete().eq('attempt_id', attemptId)
    await supabaseAdmin.from('attempts').delete().eq('id', attemptId)

    revalidatePath(`/admin/tests/${testId}/results`)
    revalidatePath(`/admin/tests/${testId}/monitor`)

    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}

// ---------------------------------------------------------------------------
// Query: Live Exam Monitoring Data
// ---------------------------------------------------------------------------
export interface ActiveStudentSession {
  attemptId: string
  studentName: string
  studentIdentifier: string | null
  startedAt: string
  timeElapsedMinutes: number
  answeredCount: number
  totalQuestions: number
  cheatEventCount: number
  latestViolation: string | null
}

export interface LiveMonitorData {
  testId: string
  testTitle: string
  durationMinutes: number | null
  totalQuestions: number
  activeCount: number
  submittedCount: number
  activeStudents: ActiveStudentSession[]
}

export async function getLiveMonitorData(testId: string): Promise<{
  error?: string
  data?: LiveMonitorData
}> {
  try {
    const { test } = await verifyTeacherOwnership(testId)

    // Fetch test duration and pool config
    const { data: testDetails } = await supabaseAdmin
      .from('tests')
      .select('title, time_limit_mins, pool_pick_count')
      .eq('id', testId)
      .single()

    // Fetch question count
    const { count: qCount } = await supabaseAdmin
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('test_id', testId)

    const totalQuestions = (testDetails?.pool_pick_count && testDetails.pool_pick_count > 0)
      ? testDetails.pool_pick_count
      : (qCount || 0)

    // Fetch in_progress attempts
    const { data: activeAttempts, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .select('*')
      .eq('test_id', testId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })

    if (attemptsError || !activeAttempts) {
      return { error: 'Failed to fetch active attempts: ' + attemptsError?.message }
    }

    // Fetch count of submitted attempts
    const { count: submittedCount } = await supabaseAdmin
      .from('attempts')
      .select('id', { count: 'exact', head: true })
      .eq('test_id', testId)
      .in('status', ['submitted', 'pending_review'])

    const activeAttemptIds = activeAttempts.map((a) => a.id)

    // Fetch responses for active attempts to calculate answered count
    const answeredMap: Record<string, number> = {}
    if (activeAttemptIds.length > 0) {
      const { data: responses } = await supabaseAdmin
        .from('responses')
        .select('attempt_id, student_answer')
        .in('attempt_id', activeAttemptIds)

      responses?.forEach((r) => {
        const ans = r.student_answer
        if (ans !== null && ans !== undefined) {
          if (Array.isArray(ans) && ans.length > 0) {
            answeredMap[r.attempt_id] = (answeredMap[r.attempt_id] || 0) + 1
          } else if (typeof ans === 'string' && ans.trim().length > 0) {
            answeredMap[r.attempt_id] = (answeredMap[r.attempt_id] || 0) + 1
          } else if (typeof ans === 'object' && Object.keys(ans as object).length > 0) {
            answeredMap[r.attempt_id] = (answeredMap[r.attempt_id] || 0) + 1
          }
        }
      })
    }

    // Fetch cheat logs for active attempts
    const cheatMap: Record<string, { count: number; latest: string | null }> = {}
    if (activeAttemptIds.length > 0) {
      const { data: logs } = await supabaseAdmin
        .from('cheat_logs')
        .select('attempt_id, event_type, occurred_at')
        .in('attempt_id', activeAttemptIds)
        .order('occurred_at', { ascending: false })

      logs?.forEach((l) => {
        if (!cheatMap[l.attempt_id]) {
          cheatMap[l.attempt_id] = { count: 1, latest: l.event_type }
        } else {
          cheatMap[l.attempt_id]!.count++
        }
      })
    }

    const now = Date.now()
    const activeStudents: ActiveStudentSession[] = activeAttempts.map((a) => {
      const start = new Date(a.started_at).getTime()
      const elapsed = Math.max(0, Math.floor((now - start) / 60000))

      return {
        attemptId: a.id,
        studentName: a.student_name,
        studentIdentifier: a.student_identifier,
        startedAt: a.started_at,
        timeElapsedMinutes: elapsed,
        answeredCount: answeredMap[a.id] || 0,
        totalQuestions,
        cheatEventCount: cheatMap[a.id]?.count || 0,
        latestViolation: cheatMap[a.id]?.latest || null,
      }
    })

    return {
      data: {
        testId: test.id,
        testTitle: testDetails?.title || test.title,
        durationMinutes: testDetails?.time_limit_mins || null,
        totalQuestions,
        activeCount: activeAttempts.length,
        submittedCount: submittedCount || 0,
        activeStudents,
      },
    }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}

