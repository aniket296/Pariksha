'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createTestAction, type TestActionResult } from '@/lib/actions/tests'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" isLoading={pending} size="md">
      Create Test
    </Button>
  )
}

/**
 * Client Component form to create a new test.
 * On success, the server action redirects to the edit page.
 * On failure, the error is shown inline.
 */
export function NewTestForm() {
  const [state, formAction] = useFormState<TestActionResult, FormData>(
    createTestAction,
    {}
  )

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      {state.error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div>
        <Label htmlFor="test-title" required>
          Test title
        </Label>
        <Input
          id="test-title"
          name="title"
          type="text"
          required
          maxLength={200}
          placeholder="e.g. Chapter 5 Quiz — Photosynthesis"
          autoFocus
        />
        <p className="mt-1 text-xs text-gray-400">
          You can add a description and questions after creating the test.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton />
        <a
          href="/admin/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
