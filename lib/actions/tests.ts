'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export interface TestActionResult {
  error?: string
  success?: boolean
}

// ---------------------------------------------------------------------------
// Internal helper: get authenticated teacher, redirect if not logged in
// ---------------------------------------------------------------------------
async function getAuthenticatedTeacher() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/admin/login')
  }
  // TypeScript non-null assertion is safe after the guard above
  return { supabase, user: user! }
}

// ---------------------------------------------------------------------------
// createTestAction
// Used with useFormState in NewTestForm.
// On success: redirects to the edit page for the new test.
// ---------------------------------------------------------------------------
export async function createTestAction(
  _prevState: TestActionResult,
  formData: FormData
): Promise<TestActionResult> {
  const title = formData.get('title')?.toString().trim()

  if (!title) {
    return { error: 'Test title is required.' }
  }
  if (title.length > 200) {
    return { error: 'Title must be 200 characters or fewer.' }
  }

  const { supabase, user } = await getAuthenticatedTeacher()

  const { data, error } = await supabase
    .from('tests')
    .insert({
      teacher_id: user.id,
      title,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[createTestAction] DB error:', error?.message)
    return { error: 'Failed to create test. Please try again.' }
  }

  redirect(`/admin/tests/${data.id}/edit`)
}

// ---------------------------------------------------------------------------
// updateTestBasicAction
// Bound pattern: updateTestBasicAction.bind(null, testId)
// Used with useFormState in TestBasicForm.
// ---------------------------------------------------------------------------
export async function updateTestBasicAction(
  testId: string,
  _prevState: TestActionResult,
  formData: FormData
): Promise<TestActionResult> {
  const title = formData.get('title')?.toString().trim()
  const description =
    formData.get('description')?.toString().trim() || null

  if (!title) {
    return { error: 'Test title is required.' }
  }
  if (title.length > 200) {
    return { error: 'Title must be 200 characters or fewer.' }
  }
  if (description && description.length > 2000) {
    return { error: 'Description must be 2000 characters or fewer.' }
  }

  const { supabase, user } = await getAuthenticatedTeacher()

  const { error } = await supabase
    .from('tests')
    .update({ title, description })
    .eq('id', testId)
    .eq('teacher_id', user.id) // Ownership enforced server-side

  if (error) {
    console.error('[updateTestBasicAction] DB error:', error.message)
    return { error: 'Failed to save changes. Please try again.' }
  }

  revalidatePath(`/admin/tests/${testId}/edit`)
  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ---------------------------------------------------------------------------
// archiveTestAction
// Bound pattern: archiveTestAction.bind(null, testId) → used as form action
// ---------------------------------------------------------------------------
export async function archiveTestAction(
  testId: string,
  _formData: FormData
): Promise<void> {
  const { supabase, user } = await getAuthenticatedTeacher()

  await supabase
    .from('tests')
    .update({ status: 'archived' })
    .eq('id', testId)
    .eq('teacher_id', user.id)

  revalidatePath('/admin/dashboard')
}

// ---------------------------------------------------------------------------
// restoreTestAction
// Restores an archived test back to draft status.
// Bound pattern: restoreTestAction.bind(null, testId)
// ---------------------------------------------------------------------------
export async function restoreTestAction(
  testId: string,
  _formData: FormData
): Promise<void> {
  const { supabase, user } = await getAuthenticatedTeacher()

  await supabase
    .from('tests')
    .update({ status: 'draft' })
    .eq('id', testId)
    .eq('teacher_id', user.id)

  revalidatePath('/admin/dashboard')
}

// ---------------------------------------------------------------------------
// deleteTestAction
// Only draft tests can be deleted (to preserve student attempt data).
// Bound pattern: deleteTestAction.bind(null, testId)
// ---------------------------------------------------------------------------
export async function deleteTestAction(
  testId: string,
  _formData: FormData
): Promise<void> {
  const { supabase, user } = await getAuthenticatedTeacher()

  // Verify ownership and draft status before deleting
  const { data: test } = await supabase
    .from('tests')
    .select('status')
    .eq('id', testId)
    .eq('teacher_id', user.id)
    .single()

  if (!test || test.status !== 'draft') {
    // Silently guard — only draft tests may be deleted
    revalidatePath('/admin/dashboard')
    return
  }

  await supabase
    .from('tests')
    .delete()
    .eq('id', testId)
    .eq('teacher_id', user.id)

  revalidatePath('/admin/dashboard')
}
