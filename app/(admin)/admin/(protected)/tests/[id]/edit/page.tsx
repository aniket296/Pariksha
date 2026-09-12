import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TestBasicForm } from '@/components/admin/TestBasicForm'
import { QuestionList } from '@/components/admin/questions/QuestionList'
import { TestShufflingSettings } from '@/components/admin/questions/TestShufflingSettings'
import { TestNavHeader } from '@/components/admin/TestNavHeader'

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

  // Fetch questions for this test
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('test_id', test.id)
    .order('order_index', { ascending: true })

  const questionList = questions || []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <TestNavHeader
        testId={test.id}
        testTitle={test.title}
        status={test.status}
        activeTab="questions"
      />

      {/* Basic info section */}
      <section
        aria-labelledby="basic-info-heading"
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      >
        <h2
          id="basic-info-heading"
          className="text-base font-semibold text-gray-900 mb-4"
        >
          Basic Information
        </h2>
        <TestBasicForm
          testId={test.id}
          defaultTitle={test.title}
          defaultDescription={test.description}
        />
      </section>

      {/* Shuffling and Pool Settings */}
      <section aria-labelledby="shuffling-heading">
        <TestShufflingSettings
          testId={test.id}
          shuffleQuestions={test.shuffle_questions}
          shuffleOptions={test.shuffle_options}
          poolPickCount={test.pool_pick_count}
          totalQuestions={questionList.length}
        />
      </section>

      {/* Question Builder Section */}
      <section
        aria-labelledby="questions-builder-heading"
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      >
        <QuestionList
          testId={test.id}
          questions={questionList}
        />
      </section>
    </div>
  )
}
