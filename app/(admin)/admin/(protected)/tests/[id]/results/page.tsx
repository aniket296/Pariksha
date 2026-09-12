import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTestAnalytics } from '@/lib/actions/analytics'
import { TestNavHeader } from '@/components/admin/TestNavHeader'
import { ScoreHistogram } from '@/components/admin/analytics/ScoreHistogram'
import { ItemAnalysisTable } from '@/components/admin/analytics/ItemAnalysisTable'
import { AttemptsTable } from '@/components/admin/analytics/AttemptsTable'
import {
  Users,
  Award,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface ResultsPageProps {
  params: { id: string }
}

export async function generateMetadata({
  params,
}: ResultsPageProps): Promise<Metadata> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { title: 'Results & Analytics' }

  const { data } = await supabase
    .from('tests')
    .select('title')
    .eq('id', params.id)
    .eq('teacher_id', user.id)
    .single()

  return { title: data ? `Results — ${data.title}` : 'Results & Analytics' }
}

export default async function TestResultsPage({ params }: ResultsPageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Fetch test basic info
  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('id, title, status')
    .eq('id', params.id)
    .eq('teacher_id', user.id)
    .single()

  if (testError || !test) {
    notFound()
  }

  // Fetch complete analytics
  const analyticsRes = await getTestAnalytics(params.id)

  if (analyticsRes.error || !analyticsRes.stats) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
        <TestNavHeader
          testId={test.id}
          testTitle={test.title}
          status={test.status}
          activeTab="results"
        />
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-rose-700 text-sm">
          Failed to load results and analytics: {analyticsRes.error}
        </div>
      </div>
    )
  }

  const { stats, distribution = [], itemAnalysis = [], attempts = [] } = analyticsRes
  const completedAttemptsCount = stats.submittedCount + stats.pendingReviewCount

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <TestNavHeader
        testId={test.id}
        testTitle={test.title}
        status={test.status}
        activeTab="results"
      />

      {/* Summary KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Attempts */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Attempts
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {stats.totalAttempts}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
              <span>{stats.submittedCount} completed</span>
              {stats.pendingReviewCount > 0 && (
                <span className="text-amber-600 font-semibold">
                  • {stats.pendingReviewCount} pending essay
                </span>
              )}
              {stats.inProgressCount > 0 && (
                <span className="text-blue-600 font-semibold">
                  • {stats.inProgressCount} active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Average Score
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {stats.averagePercentage}%
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {stats.averageScore} / {stats.maxPossibleScore} avg points
            </div>
          </div>
        </div>

        {/* Pass Rate */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Pass Rate
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {stats.passRate}%
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              Median score: {stats.medianPercentage}%
            </div>
          </div>
        </div>

        {/* Score Range */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Score Range
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {stats.highestScore}{' '}
              <span className="text-sm font-normal text-gray-400">/ {stats.lowestScore}</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              High / Low points scored
            </div>
          </div>
        </div>
      </section>

      {/* Distribution & Performance Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ScoreHistogram
            distribution={distribution}
            totalCount={completedAttemptsCount}
          />
        </div>

        <div className="lg:col-span-2">
          <ItemAnalysisTable items={itemAnalysis} />
        </div>
      </section>

      {/* Full Attempts Table */}
      <section>
        <AttemptsTable testId={test.id} attempts={attempts} />
      </section>
    </div>
  )
}

