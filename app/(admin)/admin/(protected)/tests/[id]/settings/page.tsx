import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PublishBar } from '@/components/admin/settings/PublishBar'
import { SettingsContainer } from '@/components/admin/settings/SettingsContainer'
import { TestNavHeader } from '@/components/admin/TestNavHeader'

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
    <div className="max-w-5xl mx-auto space-y-6">
      <TestNavHeader
        testId={test.id}
        testTitle={test.title}
        status={test.status}
        activeTab="settings"
      />

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

