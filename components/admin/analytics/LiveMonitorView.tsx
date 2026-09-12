'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { LiveMonitorData, ActiveStudentSession } from '@/lib/actions/analytics'
import { forceSubmitAttemptAction } from '@/lib/actions/analytics'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  Eye,
  StopCircle,
} from 'lucide-react'

interface LiveMonitorViewProps {
  initialData: LiveMonitorData
}

export function LiveMonitorView({ initialData }: LiveMonitorViewProps) {
  const router = useRouter()
  const [data, setData] = useState<LiveMonitorData>(initialData)
  const [search, setSearch] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(10) // seconds
  const [countdown, setCountdown] = useState(10)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Keep data updated when props change (from router.refresh)
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Countdown and periodic refresh
  useEffect(() => {
    if (!autoRefresh) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.refresh()
          return refreshInterval
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [autoRefresh, refreshInterval, router])

  const handleManualRefresh = () => {
    setCountdown(refreshInterval)
    startTransition(() => {
      router.refresh()
    })
  }

  const handleForceSubmit = (attemptId: string, studentName: string) => {
    if (
      !confirm(
        `Are you sure you want to force submit the exam for "${studentName}"? Their current answers will be graded immediately.`
      )
    ) {
      return
    }

    setActionError(null)
    setActionSuccess(null)
    startTransition(async () => {
      const res = await forceSubmitAttemptAction(data.testId, attemptId)
      if (res.error) {
        setActionError(res.error)
      } else {
        setActionSuccess(`Attempt for "${studentName}" has been submitted and graded.`)
        router.refresh()
      }
    })
  }

  const filteredStudents = data.activeStudents.filter(
    (s) =>
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      (s.studentIdentifier &&
        s.studentIdentifier.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Top Monitor Status & Control Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Live Proctoring & Activity Feed
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                Live
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Real-time student progress, timing, and security event logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
            />
            <label htmlFor="autoRefresh" className="cursor-pointer select-none">
              Auto-refresh {autoRefresh && `(${countdown}s)`}
            </label>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Action Banners */}
      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-rose-600 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400 hover:text-emerald-600 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Currently Active
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {data.activeCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              Taking test right now
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Submitted So Far
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {data.submittedCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              Exams completed
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Time Limit
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {data.durationMinutes ? `${data.durationMinutes} min` : 'No limit'}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {data.totalQuestions} questions per student
            </div>
          </div>
        </div>
      </div>

      {/* Active Students List / Proctoring Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
              Active Students ({data.activeCount})
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Continuous monitoring of progress, time elapsed, and integrity alerts.
            </p>
          </div>

          {data.activeStudents.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search active students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
          )}
        </div>

        {data.activeStudents.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-gray-700">
              No students are currently taking this test
            </div>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              When students access the test link and begin their exam, their live progress and security status will appear here automatically.
            </p>
            <div className="pt-2">
              <Link
                href={`/admin/tests/${data.testId}/results`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                View completed test results →
              </Link>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No active students match your search.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-6">Student</th>
                  <th className="py-2.5 px-4">Time Elapsed</th>
                  <th className="py-2.5 px-4">Questions Answered</th>
                  <th className="py-2.5 px-4 text-center">Integrity Status</th>
                  <th className="py-2.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((s) => {
                  const progressPct =
                    s.totalQuestions > 0
                      ? Math.min(100, Math.round((s.answeredCount / s.totalQuestions) * 100))
                      : 0

                  const isOvertime =
                    data.durationMinutes && s.timeElapsedMinutes > data.durationMinutes

                  return (
                    <tr key={s.attemptId} className="hover:bg-gray-50/50 transition-colors">
                      {/* Student info */}
                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{s.studentName}</div>
                        {s.studentIdentifier && (
                          <div className="text-[11px] text-gray-400 font-mono">
                            ID: {s.studentIdentifier}
                          </div>
                        )}
                      </td>

                      {/* Time elapsed */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock
                            className={`w-3.5 h-3.5 ${
                              isOvertime ? 'text-rose-500' : 'text-gray-400'
                            }`}
                          />
                          <span
                            className={`font-mono font-medium ${
                              isOvertime ? 'text-rose-600 font-bold' : 'text-gray-700'
                            }`}
                          >
                            {s.timeElapsedMinutes} min
                          </span>
                          {data.durationMinutes && (
                            <span className="text-gray-400 text-[11px]">
                              / {data.durationMinutes} min
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Answered progress */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-1 w-44">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-gray-700 font-medium">
                              {s.answeredCount} / {s.totalQuestions}
                            </span>
                            <span className="text-gray-400">{progressPct}%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-600 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Integrity / Cheat alerts */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {s.cheatEventCount === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Clean
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200 animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            {s.cheatEventCount} Violation{s.cheatEventCount > 1 ? 's' : ''}
                            {s.latestViolation && (
                              <span className="font-normal text-rose-500">
                                ({s.latestViolation.replace(/_/g, ' ')})
                              </span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <Link
                            href={`/admin/tests/${data.testId}/attempts/${s.attemptId}`}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            title="Inspect Attempt & Logs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleForceSubmit(s.attemptId, s.studentName)}
                            disabled={isPending}
                            className="flex items-center gap-1 text-xs py-1 px-2.5"
                          >
                            <StopCircle className="w-3 h-3" />
                            Force Submit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
