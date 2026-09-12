import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublishBar } from '@/components/admin/settings/PublishBar'
import { SettingsContainer } from '@/components/admin/settings/SettingsContainer'

export const dynamic = 'force-dynamic'

interface SettingsPageProps {
  params: { id: string }
}

export async function generateMetadata({
  params,
}: SettingsPageProps): Promise<Metadata> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { title: 'Test Settings' }

  const { data } = await supabase
    .from('tests')
    .select('title')
    .eq('id', params.id)
    .eq('teacher_id', user.id)
    .single()

  return { title: data ? `Settings — ${data.title}` : 'Test Settings' }
}

export default async function TestSettingsPage({ params }: SettingsPageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Fetch test details
  const { data: test, error } = await supabase
    .from('tests')
    .select('*')
    .eq('id', params.id)
    .eq('teacher_id', user.id)
    .single()

  if (error || !test) {
    notFound()
  }

  // Fetch question count for publishing pre-flight check
  const { count: questionCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('test_id', test.id)

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
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
          <li>
            <Link
              href={`/admin/tests/${test.id}/edit`}
              className="hover:text-gray-700 transition-colors truncate max-w-[150px] inline-block align-bottom"
            >
              {test.title}
            </Link>
          </li>
          <li aria-hidden="true" className="text-gray-300">
            /
          </li>
          <li className="text-gray-900 font-medium" aria-current="page">
            Settings
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Settings: {test.title}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure access credentials, scheduling, timing, anti-cheat, and results disclosure.
          </p>
        </div>

        {/* Link back to Questions editor */}
        <Link
          href={`/admin/tests/${test.id}/edit`}
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
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Edit Questions
        </Link>
      </div>

      {/* Publishing & Link Bar */}
      <PublishBar
        testId={test.id}
        currentStatus={test.status}
        questionCount={questionCount || 0}
        hasOpenAt={Boolean(test.open_at)}
        hasCloseAt={Boolean(test.close_at)}
      />

      {/* Main Settings Editor */}
      <SettingsContainer test={test} />
    </div>
  )
}
