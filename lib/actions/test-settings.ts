'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  AccessType,
  LayoutStyle,
  WhitelistEntry,
  AntiCheatConfig,
  ReviewConfig,
  TestStatus,
} from '@/lib/types/database'

export interface SettingsActionResult {
  error?: string
  success?: boolean
  message?: string
}

// ---------------------------------------------------------------------------
// Security Helper: verify teacher ownership of test
// ---------------------------------------------------------------------------
async function verifyTestOwnership(testId: string) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .eq('teacher_id', user.id)
    .single()

  if (testError || !test) {
    throw new Error('Test not found or access denied')
  }

  return { supabase, user, test }
}

// ---------------------------------------------------------------------------
// Action: Update All Test Settings
// ---------------------------------------------------------------------------
export interface UpdateTestSettingsPayload {
  // Access & Passcode
  access_type: AccessType
  passcode: string | null
  max_attempts: number
  whitelist_data: WhitelistEntry[]

  // Schedule
  open_at: string | null
  close_at: string | null

  // Timing & Presentation
  time_limit_mins: number
  layout_style: LayoutStyle

  // Grading
  pass_percentage: number
  pass_message: string | null
  fail_message: string | null

  // Anti-Cheat & Review
  anti_cheat_config: AntiCheatConfig
  review_config: ReviewConfig
}

export async function updateTestSettingsAction(
  testId: string,
  payload: UpdateTestSettingsPayload
): Promise<SettingsActionResult> {
  try {
    const { supabase } = await verifyTestOwnership(testId)

    // Validation 1: Schedule ordering
    if (payload.open_at && payload.close_at) {
      const openTime = new Date(payload.open_at).getTime()
      const closeTime = new Date(payload.close_at).getTime()
      if (closeTime <= openTime) {
        return { error: 'Closing date and time must be after the opening date and time.' }
      }
    }

    // Validation 2: Pass percentage
    if (payload.pass_percentage < 0 || payload.pass_percentage > 100) {
      return { error: 'Pass percentage must be between 0 and 100.' }
    }

    // Validation 3: Time limit & attempts
    if (payload.time_limit_mins < 0) {
      return { error: 'Time limit cannot be negative.' }
    }
    if (payload.max_attempts < 0) {
      return { error: 'Maximum attempts cannot be negative.' }
    }

    // Validation 4: Whitelist required if access_type is whitelist
    if (payload.access_type === 'whitelist' && payload.whitelist_data.length === 0) {
      return { error: 'At least one student must be in the whitelist when whitelist access is chosen.' }
    }

    // Clean passcode
    const passcode = payload.passcode?.trim() || null

    const { error: updateError } = await supabase
      .from('tests')
      .update({
        access_type: payload.access_type,
        passcode,
        max_attempts: payload.max_attempts,
        whitelist_data: payload.whitelist_data,
        open_at: payload.open_at,
        close_at: payload.close_at,
        time_limit_mins: payload.time_limit_mins,
        layout_style: payload.layout_style,
        pass_percentage: payload.pass_percentage,
        pass_message: payload.pass_message?.trim() || null,
        fail_message: payload.fail_message?.trim() || null,
        anti_cheat_config: payload.anti_cheat_config,
        review_config: payload.review_config,
      })
      .eq('id', testId)

    if (updateError) {
      return { error: 'Failed to update settings: ' + updateError.message }
    }

    revalidatePath(`/admin/tests/${testId}/settings`)
    revalidatePath(`/admin/tests/${testId}/edit`)
    revalidatePath('/admin/dashboard')

    return { success: true, message: 'Settings saved successfully.' }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}

// ---------------------------------------------------------------------------
// Action: Publish Test (with pre-flight readiness checks)
// ---------------------------------------------------------------------------
export async function setTestStatusAction(
  testId: string,
  newStatus: TestStatus
): Promise<SettingsActionResult> {
  try {
    const { supabase, test } = await verifyTestOwnership(testId)

    if (newStatus === 'published') {
      // Check question count
      const { count, error: countError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('test_id', testId)

      if (countError || count === null || count === 0) {
        return {
          error: 'Cannot publish a test with 0 questions. Please add at least one question first.',
        }
      }

      // Check pool pick count
      if (test.pool_pick_count !== null && test.pool_pick_count > count) {
        return {
          error: `Question pool pick count (${test.pool_pick_count}) exceeds total questions available (${count}).`,
        }
      }

      // Check schedule validity if closed in the past
      if (test.close_at && new Date(test.close_at).getTime() < Date.now()) {
        return {
          error: 'Cannot publish a test whose closing date is already in the past.',
        }
      }
    }

    const { error: updateError } = await supabase
      .from('tests')
      .update({ status: newStatus })
      .eq('id', testId)

    if (updateError) {
      return { error: 'Failed to update test status: ' + updateError.message }
    }

    revalidatePath(`/admin/tests/${testId}/settings`)
    revalidatePath(`/admin/tests/${testId}/edit`)
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      message:
        newStatus === 'published'
          ? 'Test published! Students can now access it using the exam link.'
          : newStatus === 'archived'
          ? 'Test archived.'
          : 'Test returned to draft status.',
    }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unauthorized' }
  }
}
