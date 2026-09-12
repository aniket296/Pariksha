'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { verifyAndStartAttemptAction } from '@/lib/actions/student'
import type { AccessType } from '@/lib/types/database'

interface StudentEntryFormProps {
  testId: string
  testTitle: string
  testDescription: string | null
  timeLimitMins: number
  accessType: AccessType
  hasPasscode: boolean
  maxAttempts: number
  questionCount: number
}

export function StudentEntryForm({
  testId,
  testTitle,
  testDescription,
  timeLimitMins,
  accessType,
  hasPasscode,
  maxAttempts,
  questionCount,
}: StudentEntryFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [passcode, setPasscode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await verifyAndStartAttemptAction(testId, {
        name,
        identifier: identifier || undefined,
        passcode: passcode || undefined,
      })

      if (res.error) {
        setError(res.error)
        setIsLoading(false)
      } else if (res.attemptId && res.sessionToken) {
        // Store session token in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`pariksha_token_${res.attemptId}`, res.sessionToken)
        }
        // Redirect to exam runner
        router.push(`/t/${testId}/take?attemptId=${res.attemptId}&token=${res.sessionToken}`)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start exam')
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6 max-w-lg mx-auto">
      {/* Test Overview */}
      <div className="space-y-3 pb-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          {testTitle}
        </h1>
        {testDescription && (
          <p className="text-sm text-gray-600 leading-relaxed">
            {testDescription}
          </p>
        )}

        {/* Quick Badges */}
        <div className="flex flex-wrap gap-2 pt-1 text-xs text-gray-600">
          <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium">
            ⏱ {timeLimitMins > 0 ? `${timeLimitMins} Minutes` : 'Untimed'}
          </span>
          <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium">
            📝 {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
          </span>
          {maxAttempts > 0 && (
            <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium">
              🎯 Max {maxAttempts} {maxAttempts === 1 ? 'Attempt' : 'Attempts'}
            </span>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl"
        >
          {error}
        </div>
      )}

      {/* Entry Form */}
      <form onSubmit={handleStart} className="space-y-4">
        {/* Full Name */}
        <div>
          <Label htmlFor="student-name" required>
            Your Full Name
          </Label>
          <Input
            id="student-name"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Doe"
          />
        </div>

        {/* Student ID / Roll No */}
        {accessType !== 'name_only' && (
          <div>
            <Label
              htmlFor="student-id"
              required={accessType === 'name_and_id'}
            >
              Student ID / Roll Number
            </Label>
            <Input
              id="student-id"
              type="text"
              required={accessType === 'name_and_id'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. STU-2026-042"
            />
            {accessType === 'whitelist' && (
              <p className="text-[11px] text-gray-400 mt-1">
                Enter your registered ID if one was provided in the roster.
              </p>
            )}
          </div>
        )}

        {/* Passcode */}
        {hasPasscode && (
          <div>
            <Label htmlFor="exam-passcode" required>
              Exam Passcode
            </Label>
            <Input
              id="exam-passcode"
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode from your instructor"
            />
          </div>
        )}

        {/* Start Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full text-base font-semibold py-3"
          >
            Start Exam →
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-gray-400">
        By clicking Start Exam, your session timer will begin if this exam is timed.
      </p>
    </div>
  )
}

