import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TestBasicForm } from '@/components/admin/TestBasicForm'
import { StatusBadge } from '@/components/ui/Badge'

// Force dynamic — fetches per-test data
export const dynamic = 'force-dynamic'

interface EditPageProps {
  params: { id: string }
}

export async function generateMetadata({
  params,
}: EditPageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { title: 'Edit Test' }

  const { data } = await supabase
    .from('tests')
    .select('title')
    .eq('id', params.id)
    .eq('teacher_id', user.id)
    .single()

  return { title: data ? `Edit — ${data.title}` : 'Edit Test' }
}

export default async function EditTestPage({ params }: EditPageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Fetch test — ownership enforced by teacher_id filter
  const { data: test, error } = await supabase
    .from('tests')
    .select('*')
    .eq('id', params.id)
    .eq('teacher_id', user.id)
    .single()

  if (error || !test) {
    notFound()
  }

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li>
            <Link
              href="/admin/dashboard"
              className="hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true" className="text-gray-300">
            /
          </li>
          <li className="text-gray-900 font-medium truncate max-w-[200px]" aria-current="page">
            {test.title}
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {test.title}
            </h1>
            <StatusBadge status={test.status} />
          </div>
          <p className="text-sm text-gray-500">
            Test ID: <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{test.id}</code>
          </p>
        </div>

        {/* Settings link (will be fully implemented in Phase 4) */}
        <Link
          href={`/admin/tests/${test.id}/settings`}
          className="
            inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-md
            border border-gray-300 bg-white text-gray-700
            hover:bg-gray-50 transition-colors
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-brand-500 focus-visible:ring-offset-2
          "
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 15a3 3 0 100-6 3 3 0 000 6z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          Settings
        </Link>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {/* Basic info section */}
        <section
          aria-labelledby="basic-info-heading"
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
          <h2
            id="basic-info-heading"
            className="text-base font-semibold text-gray-900 mb-4"
          >
            Basic information
          </h2>
          <TestBasicForm
            testId={test.id}
            defaultTitle={test.title}
            defaultDescription={test.description}
          />
        </section>

        {/* Questions section — Question Builder added in Phase 3 */}
        <section
          aria-labelledby="questions-heading"
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              id="questions-heading"
              className="text-base font-semibold text-gray-900"
            >
              Questions
            </h2>
            <span className="text-xs font-medium text-gray-400 tabular-nums">
              0 questions
            </span>
          </div>

          {/* Empty state — Question Builder will be embedded here in Phase 3 */}
          <div className="text-center py-12 rounded-lg bg-gray-50 border border-dashed border-gray-200">
            <div
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-400 mb-3"
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 12h6M12 9v6M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              No questions yet
            </p>
            <p className="text-xs text-gray-400">
              The question builder will be available here.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
