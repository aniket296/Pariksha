import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function escapeCsvField(field: unknown): string {
  if (field === null || field === undefined) return ''
  const str = String(field)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testId = params.id
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('id, title, teacher_id')
      .eq('id', testId)
      .eq('teacher_id', user.id)
      .single()

    if (testError || !test) {
      return NextResponse.json({ error: 'Test not found or access denied' }, { status: 404 })
    }

    // Fetch attempts
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .select('*')
      .eq('test_id', testId)
      .order('started_at', { ascending: true })

    if (attemptsError || !attempts) {
      return NextResponse.json({ error: 'Failed to load attempts' }, { status: 500 })
    }

    // Fetch questions
    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id, order_index, prompt')
      .eq('test_id', testId)
      .order('order_index', { ascending: true })

    // Fetch responses
    const attemptIds = attempts.map((a) => a.id)
    const { data: responses } = await supabaseAdmin
      .from('responses')
      .select('attempt_id, question_id, awarded_points')
      .in('attempt_id', attemptIds)

    const responsePointsMap: Record<string, Record<string, number | null>> = {}
    responses?.forEach((r) => {
      if (!responsePointsMap[r.attempt_id]) {
        responsePointsMap[r.attempt_id] = {}
      }
      responsePointsMap[r.attempt_id]![r.question_id] = r.awarded_points
    })

    // Fetch cheat logs
    const { data: cheatLogs } = await supabaseAdmin
      .from('cheat_logs')
      .select('attempt_id')
      .in('attempt_id', attemptIds)

    const cheatCounts: Record<string, number> = {}
    cheatLogs?.forEach((l) => {
      cheatCounts[l.attempt_id] = (cheatCounts[l.attempt_id] || 0) + 1
    })

    // Build CSV Headers
    const headers = [
      'Student Name',
      'Student ID',
      'Status',
      'Score',
      'Max Score',
      'Percentage',
      'Result',
      'Violations',
      'Started At',
      'Submitted At',
      'Duration (Mins)',
    ]

    // Append question columns
    questions?.forEach((q, idx) => {
      headers.push(`Q${idx + 1} Points`)
    })

    const rows: string[] = [headers.join(',')]

    attempts.forEach((a) => {
      let durationMins = ''
      if (a.started_at && a.submitted_at) {
        const start = new Date(a.started_at).getTime()
        const end = new Date(a.submitted_at).getTime()
        durationMins = String(Math.max(1, Math.round((end - start) / 60000)))
      }

      const resultLabel =
        a.status === 'pending_review'
          ? 'Pending Review'
          : a.is_passed === true
          ? 'PASSED'
          : a.is_passed === false
          ? 'FAILED'
          : 'Incomplete'

      const row = [
        escapeCsvField(a.student_name),
        escapeCsvField(a.student_identifier || ''),
        escapeCsvField(a.status),
        escapeCsvField(a.score ?? ''),
        escapeCsvField(a.max_score),
        escapeCsvField(a.percentage !== null ? `${a.percentage}%` : ''),
        escapeCsvField(resultLabel),
        escapeCsvField(cheatCounts[a.id] || 0),
        escapeCsvField(a.started_at ? new Date(a.started_at).toISOString() : ''),
        escapeCsvField(a.submitted_at ? new Date(a.submitted_at).toISOString() : ''),
        escapeCsvField(durationMins),
      ]

      // Per-question scores
      questions?.forEach((q) => {
        const pts = responsePointsMap[a.id]?.[q.id]
        row.push(escapeCsvField(pts ?? ''))
      })

      rows.push(row.join(','))
    })

    const csvOutput = rows.join('\r\n')
    const sanitizedTitle = test.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
    const filename = `pariksha_${sanitizedTitle}_results.csv`

    return new Response(csvOutput, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}

