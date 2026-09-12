import { NextRequest, NextResponse } from 'next/server'
import { saveStudentResponseAction } from '@/lib/actions/student'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { attemptId, sessionToken, questionId, studentAnswer } = body

    if (!attemptId || !sessionToken || !questionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const result = await saveStudentResponseAction(
      attemptId,
      sessionToken,
      questionId,
      studentAnswer
    )

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

