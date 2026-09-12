'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface AuthActionResult {
  error?: string
}

/**
 * Server Action: authenticate the teacher with email + password.
 * On success: redirects to /admin/dashboard.
 * On failure: returns { error } for the LoginForm to display.
 *
 * SECURITY:
 *  - Validation is server-side.
 *  - Error messages are generic (do not reveal whether email exists).
 *  - Supabase handles brute-force protection.
 */
export async function loginAction(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get('email')?.toString().trim()
  const password = formData.get('password')?.toString()

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Generic message — do not expose whether email exists or not
    return { error: 'Invalid email or password. Please try again.' }
  }

  redirect('/admin/dashboard')
}

/**
 * Server Action: sign out the teacher and redirect to login.
 * Takes _formData so it can be used directly as a <form> action.
 */
export async function logoutAction(_formData: FormData): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
