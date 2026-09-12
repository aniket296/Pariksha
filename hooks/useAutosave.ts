'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export type SaveStatus = 'saved' | 'saving' | 'error'

interface UseAutosaveOptions {
  attemptId: string
  sessionToken: string
  initialResponses?: Record<string, unknown>
}

export function useAutosave({
  attemptId,
  sessionToken,
  initialResponses = {},
}: UseAutosaveOptions) {
  const [responses, setResponses] = useState<Record<string, unknown>>(() => {
    // Try restoring from localStorage first as backup
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`pariksha_backup_${attemptId}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          return { ...initialResponses, ...parsed }
        }
      } catch {
        // Fallback to initial
      }
    }
    return initialResponses
  })

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})

  // Persist to localStorage whenever responses change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `pariksha_backup_${attemptId}`,
          JSON.stringify(responses)
        )
      } catch {
        // Quota or private mode fallback
      }
    }
  }, [attemptId, responses])

  const saveToServer = useCallback(
    async (questionId: string, value: unknown) => {
      setSaveStatus('saving')
      try {
        const res = await fetch('/api/student/save-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId,
            sessionToken,
            questionId,
            studentAnswer: value,
          }),
        })

        if (!res.ok) {
          setSaveStatus('error')
        } else {
          setSaveStatus('saved')
        }
      } catch {
        setSaveStatus('error')
      }
    },
    [attemptId, sessionToken]
  )

  // Update response with 600ms debounce
  const setAnswer = useCallback(
    (questionId: string, value: unknown) => {
      setResponses((prev) => ({ ...prev, [questionId]: value }))

      // Clear existing debounce timer for this question
      if (debounceTimers.current[questionId]) {
        clearTimeout(debounceTimers.current[questionId])
      }

      setSaveStatus('saving')

      debounceTimers.current[questionId] = setTimeout(() => {
        saveToServer(questionId, value)
      }, 600)
    },
    [saveToServer]
  )

  // Cleanup on unmount
  useEffect(() => {
    const timers = debounceTimers.current
    return () => {
      Object.values(timers).forEach((t) => clearTimeout(t))
    }
  }, [])

  return {
    responses,
    setAnswer,
    saveStatus,
  }
}

