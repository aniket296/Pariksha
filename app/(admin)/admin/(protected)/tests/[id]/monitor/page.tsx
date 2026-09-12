import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLiveMonitorData } from '@/lib/actions/analytics'
import { TestNavHeader } from '@/components/admin/TestNavHeader'
import { LiveMonitorView } from '@/components/admin/analytics/LiveMonitorView'

export const dynamic = 'force-dynamic'

interface MonitorPageProps {
  params: { id: string }
}

export async function generateMetadata({
  params,
}: MonitorPageProps): Promise<Metadata> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { title: 'Live Monitor' }

  const { data } = await supabase
    .from('tests')
    .select('title')
    .eq('id', params.id)
    .eq('teacher_id', user.id)
    .single()

  return { title: data ? `Monitor — ${data.title}` : 'Live Monitor' }
}

export default async function TestMonitorPage({ params }: MonitorPageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Fetch test info & verify ownership
  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('id, title, status')
    .eq('id', params.id)
    .eq('teacher_id', user.id)
    .single()

  if (testError || !test) {
    notFound()
  }

  // Fetch live monitor data
  const monitorRes = await getLiveMonitorData(params.id)

  if (monitorRes.error || !monitorRes.data) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
        <TestNavHeader
          testId={test.id}
          testTitle={test.title}
          status={test.status}
          activeTab="monitor"
        />
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-rose-700 text-sm">
          Failed to load live monitor: {monitorRes.error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <TestNavHeader
        testId={test.id}
        testTitle={test.title}
        status={test.status}
        activeTab="monitor"
      />

      <LiveMonitorView initialData={monitorRes.data} />
    </div>
  )
}

