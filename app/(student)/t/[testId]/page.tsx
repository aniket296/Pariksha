import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { StudentEntryForm } from '@/components/student/StudentEntryForm'

export const dynamic = 'force-dynamic'

interface StudentEntryPageProps {
  params: { testId: string }
}

export async function generateMetadata({
  params,
}: StudentEntryPageProps): Promise<Metadata> {
  const { data: test } = await supabaseAdmin
    .from('tests')
    .select('title')
    .eq('id', params.testId)
    .single()

  return {
    title: test ? `${test.title} — Pariksha` : 'Exam Entry — Pariksha',
  }
}

export default async function StudentEntryPage({
  params,
}: StudentEntryPageProps) {
  // Fetch test
  const { data: test, error } = await supabaseAdmin
    .from('tests')
    .select('*')
    .eq('id', params.testId)
    .single()

  if (error || !test) {
    notFound()
  }

  // Question count
  const { count } = await supabaseAdmin
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('test_id', test.id)

  const questionCount = count || 0

  // Schedule status
  const now = Date.now()
  const isNotYetOpen = test.open_at && new Date(test.open_at).getTime() > now
  const isAlreadyClosed = test.close_at && new Date(test.close_at).getTime() < now

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-brand-700 font-bold text-xl">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="text-brand-600"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="3"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M7 9h10M7 12h6M7 15h8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>Pariksha</span>
        </div>
      </div>

      {/* Draft State Banner */}
      {test.status !== 'published' && (
        <div className="max-w-md mx-auto w-full p-6 bg-white rounded-2xl border border-amber-200 text-center shadow-sm space-y-3">
          <span className="text-3xl">🔒</span>
          <h2 className="text-lg font-bold text-gray-900">Exam Unavailable</h2>
          <p className="text-xs text-gray-600">
            This exam is currently not published by the instructor. Please contact your teacher if you believe this is an error.
          </p>
        </div>
      )}

      {/* Closed State Banner */}
      {test.status === 'published' && isAlreadyClosed && (
        <div className="max-w-md mx-auto w-full p-6 bg-white rounded-2xl border border-red-200 text-center shadow-sm space-y-3">
          <span className="text-3xl">⌛</span>
          <h2 className="text-lg font-bold text-gray-900">Exam Closed</h2>
          <p className="text-xs text-gray-600">
            This examination closed on{' '}
            <strong>{new Date(test.close_at!).toLocaleString()}</strong> and is no longer accepting submissions.
          </p>
        </div>
      )}

      {/* Not Yet Open Banner */}
      {test.status === 'published' && isNotYetOpen && !isAlreadyClosed && (
        <div className="max-w-md mx-auto w-full p-6 bg-white rounded-2xl border border-blue-200 text-center shadow-sm space-y-3">
          <span className="text-3xl">🕒</span>
          <h2 className="text-lg font-bold text-gray-900">Exam Not Started Yet</h2>
          <p className="text-xs text-gray-600">
            This examination will open on{' '}
            <strong>{new Date(test.open_at!).toLocaleString()}</strong>. Please return at that time.
          </p>
        </div>
      )}

      {/* Active Entry Form */}
      {test.status === 'published' && !isNotYetOpen && !isAlreadyClosed && (
        <StudentEntryForm
          testId={test.id}
          testTitle={test.title}
          testDescription={test.description}
          timeLimitMins={test.time_limit_mins}
          accessType={test.access_type}
          hasPasscode={Boolean(test.passcode)}
          maxAttempts={test.max_attempts}
          questionCount={questionCount}
        />
      )}
    </div>
  )
}

