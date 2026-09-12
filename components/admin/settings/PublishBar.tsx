'use client'

import { useState, useEffect } from 'react'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { setTestStatusAction } from '@/lib/actions/test-settings'
import type { TestStatus } from '@/lib/types/database'

interface PublishBarProps {
  testId: string
  currentStatus: TestStatus
  questionCount: number
  hasOpenAt: boolean
  hasCloseAt: boolean
}

export function PublishBar({
  testId,
  currentStatus,
  questionCount,
}: PublishBarProps) {
  const [status, setStatus] = useState<TestStatus>(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [studentUrl, setStudentUrl] = useState(`/t/${testId}`)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStudentUrl(`${window.location.origin}/t/${testId}`)
    }
  }, [testId])

  const handleStatusChange = async (newStatus: TestStatus) => {
    setIsLoading(true)
    setFeedback(null)
    try {
      const res = await setTestStatusAction(testId, newStatus)
      if (res.error) {
        setFeedback({ type: 'error', text: res.error })
      } else {
        setStatus(newStatus)
        setFeedback({ type: 'success', text: res.message || 'Status updated.' })
        setTimeout(() => setFeedback(null), 4000)
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update status',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(studentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Status indicator & info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Exam Status:
            </span>
            <StatusBadge status={status} />
          </div>
          <p className="text-xs text-gray-500">
            {status === 'published' && '🟢 Live and accessible by students.'}
            {status === 'draft' && '🟡 In preparation. Students cannot start this exam.'}
            {status === 'archived' && '⚪ Archived. Hidden from active students.'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {status === 'draft' && (
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isLoading}
              onClick={() => handleStatusChange('published')}
              className="bg-green-600 hover:bg-green-700 focus-visible:ring-green-500"
            >
              🚀 Publish Exam
            </Button>
          )}

          {status === 'published' && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              isLoading={isLoading}
              onClick={() => handleStatusChange('draft')}
            >
              Revert to Draft
            </Button>
          )}

          {status !== 'archived' && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              isLoading={isLoading}
              onClick={() => handleStatusChange('archived')}
              className="text-gray-500 hover:text-amber-800"
            >
              Archive
            </Button>
          )}

          {status === 'archived' && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              isLoading={isLoading}
              onClick={() => handleStatusChange('draft')}
            >
              Restore to Draft
            </Button>
          )}
        </div>
      </div>

      {/* Pre-flight warnings if in draft */}
      {status === 'draft' && questionCount === 0 && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          ⚠️ <strong>Cannot publish yet:</strong> This test currently has 0 questions. Add at least 1 question before publishing.
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs ${
            feedback.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Public Student Link */}
      <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Student Access URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={studentUrl}
              className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-gray-700 select-all"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? '✓ Copied' : 'Copy Link'}
            </Button>
          </div>
        </div>

        <div className="sm:pt-4">
          <a
            href={studentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-brand-600 hover:text-brand-800 font-medium inline-flex items-center gap-1"
          >
            Open in new tab ↗
          </a>
        </div>
      </div>
    </div>
  )
}
