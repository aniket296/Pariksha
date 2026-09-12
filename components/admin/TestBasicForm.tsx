'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { updateTestBasicAction, type TestActionResult } from '@/lib/actions/tests'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'

interface TestBasicFormProps {
  testId: string
  defaultTitle: string
  defaultDescription: string | null
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" isLoading={pending} size="md">
      Save changes
    </Button>
  )
}

/**
 * Client Component form for editing a test's title and description.
 * Binds testId to updateTestBasicAction before passing to useFormState.
 */
export function TestBasicForm({
  testId,
  defaultTitle,
  defaultDescription,
}: TestBasicFormProps) {
  // Bind testId so the server action receives it without client trust
  const boundAction = updateTestBasicAction.bind(null, testId)

  const [state, formAction] = useFormState<TestActionResult, FormData>(
    boundAction,
    {}
  )

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700"
        >
          Changes saved successfully.
        </div>
      )}

      <div>
        <Label htmlFor="edit-title" required>
          Test title
        </Label>
        <Input
          id="edit-title"
          name="title"
          type="text"
          required
          maxLength={200}
          defaultValue={defaultTitle}
          placeholder="Enter test title"
        />
      </div>

      <div>
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          name="description"
          maxLength={2000}
          defaultValue={defaultDescription ?? ''}
          placeholder="Optional: describe what this test covers, instructions for students, etc."
          rows={3}
        />
        <p className="mt-1 text-xs text-gray-400">
          Shown to students before they start the test.
        </p>
      </div>

      <SubmitButton />
    </form>
  )
}
