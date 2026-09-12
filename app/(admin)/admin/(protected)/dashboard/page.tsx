import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TestCard } from '@/components/admin/TestCard'
import { Button } from '@/components/ui/Button'
import type { Database } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Dashboard' }

// Force dynamic rendering — this page fetches user-specific data
export const dynamic = 'force-dynamic'

type Test = Database['public']['Tables']['tests']['Row']

// ---------------------------------------------------------------------------
// Stats row component
// ---------------------------------------------------------------------------
function StatsRow({ tests }: { tests: Test[] }) {
  const draft = tests.filter((t) => t.status === 'draft').length
  const published = tests.filter((t) => t.status === 'published').length
  const archived = tests.filter((t) => t.status === 'archived').length

  const stats = [
    { label: 'Total', value: tests.length, color: 'text-gray-700' },
    { label: 'Draft', value: draft, color: 'text-gray-500' },
    { label: 'Published', value: published, color: 'text-green-700' },
    { label: 'Archived', value: archived, color: 'text-amber-700' },
  ]

  return (
    <dl
      className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      aria-label="Test statistics"
    >
      {stats.map(({ label, value, color }) => (
        <div
          key={label}
          className="bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm"
        >
          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </dt>
          <dd className={`mt-1 text-2xl font-bold ${color}`}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------
export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: tests, error } = await supabase
    .from('tests')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Dashboard] Failed to fetch tests:', error.message)
  }

  const allTests: Test[] = tests ?? []

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tests</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Create, manage, and monitor your exams.
          </p>
        </div>

        <Link href="/admin/tests/new" aria-label="Create a new test">
          <Button size="md" variant="primary">
            {/* Plus icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="text-white"
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            New Test
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {allTests.length > 0 && <StatsRow tests={allTests} />}

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          Failed to load tests. Please refresh the page.
        </div>
      )}

      {/* Empty state */}
      {allTests.length === 0 && !error && (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-50 text-brand-600 mb-4"
            aria-hidden="true"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12 8v8M8 12h8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            No tests yet
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
            Create your first exam to get started. Students can access it
            once you publish it.
          </p>
          <Link href="/admin/tests/new">
            <Button size="md" variant="primary">
              Create your first test
            </Button>
          </Link>
        </div>
      )}

      {/* Test grid */}
      {allTests.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {allTests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      )}
    </div>
  )
}
