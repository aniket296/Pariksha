'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseExamTimerOptions {
  startedAt: string
  timeLimitMins: number
  onTimeExpired: () => void
}

export function useExamTimer({
  startedAt,
  timeLimitMins,
  onTimeExpired,
}: UseExamTimerOptions) {
  const isUntimed = timeLimitMins <= 0
  const onExpiredRef = useRef(onTimeExpired)
  onExpiredRef.current = onTimeExpired

  const calculateRemaining = useCallback(() => {
    if (isUntimed) return 999999
    const startMs = new Date(startedAt).getTime()
    const limitMs = timeLimitMins * 60 * 1000
    const endMs = startMs + limitMs
    const diffSec = Math.floor((endMs - Date.now()) / 1000)
    return Math.max(0, diffSec)
  }, [startedAt, timeLimitMins, isUntimed])

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemaining)

  useEffect(() => {
    if (isUntimed) return

    // Immediately check if already expired
    const initial = calculateRemaining()
    setRemainingSeconds(initial)
    if (initial <= 0) {
      onExpiredRef.current()
      return
    }

    const interval = setInterval(() => {
      const remaining = calculateRemaining()
      setRemainingSeconds(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        onExpiredRef.current()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [calculateRemaining, isUntimed])

  // Format as MM:SS or HH:MM:SS
  const formatTime = (totalSec: number): string => {
    if (isUntimed) return 'Untimed'
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60

    const pad = (n: number) => n.toString().padStart(2, '0')

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`
    }
    return `${pad(m)}:${pad(s)}`
  }

  return {
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    isUntimed,
    isExpired: !isUntimed && remainingSeconds <= 0,
    isWarning: !isUntimed && remainingSeconds <= 300 && remainingSeconds > 60,
    isCritical: !isUntimed && remainingSeconds <= 60 && remainingSeconds > 0,
  }
}

