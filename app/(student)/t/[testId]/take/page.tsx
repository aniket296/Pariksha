import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStudentAttemptStateAction } from '@/lib/actions/student'
import { QuestionRunner } from '@/components/student/QuestionRunner'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Examination — Pariksha',
  robots: { index: false, follow: false },
}

interface TakeExamPageProps {
  params: { testId: string }
  searchParams: { attemptId?: string; token?: string }
}

export default async function TakeExamPage({
  params,
  searchParams,
}: TakeExamPageProps) {
  const attemptId = searchParams.attemptId
  const token = searchParams.token

  if (!attemptId || !token) {
    redirect(`/t/${params.testId}`)
  }

  const { state, error } = await getStudentAttemptStateAction(attemptId, token)

  if (error || !state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <span className="text-4xl">⚠️</span>
          <h1 className="text-lg font-bold text-gray-900">Session Error</h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            {error || 'Unable to load exam session. Your session token may have expired or is invalid.'}
          </p>
          <div className="pt-2">
            <Link href={`/t/${params.testId}`}>
              <Button variant="primary" size="md">
                Return to Exam Entry
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <QuestionRunner initialState={state} sessionToken={token} />
}

