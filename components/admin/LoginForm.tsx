'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { loginAction, type AuthActionResult } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

// ---------------------------------------------------------------------------
// Submit button: reads pending state from useFormStatus
// Must be a separate component (useFormStatus reads the nearest parent <form>)
// ---------------------------------------------------------------------------
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" isLoading={pending} className="w-full" size="md">
      Sign in
    </Button>
  )
}

// ---------------------------------------------------------------------------
// LoginForm — Client Component
// Uses useFormState so login errors are shown without a full page reload.
// ---------------------------------------------------------------------------
export function LoginForm() {
  const [state, formAction] = useFormState<AuthActionResult, FormData>(
    loginAction,
    {}
  )

  return (
    <form action={formAction} noValidate className="space-y-5">
      {/* Server-side error message */}
      {state.error && (
        <div
          role="alert"
          aria-live="assertive"
          className="
            rounded-md bg-red-50 border border-red-200
            px-4 py-3 text-sm text-red-700
          "
        >
          {state.error}
        </div>
      )}

      <div>
        <Label htmlFor="login-email" required>
          Email address
        </Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="teacher@school.edu"
          inputMode="email"
        />
      </div>

      <div>
        <Label htmlFor="login-password" required>
          Password
        </Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      <SubmitButton />
    </form>
  )
}
