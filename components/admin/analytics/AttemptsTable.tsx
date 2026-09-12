'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AttemptListItem } from '@/lib/actions/analytics'
import { forceSubmitAttemptAction, deleteAttemptAction } from '@/lib/actions/analytics'
import { regradeAllTestAttemptsAction } from '@/lib/actions/grading'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Download,
  RefreshCw,
  Search,
  Trash2,
  Eye,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

function AttemptStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'submitted':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          Submitted
        </span>
      )
    case 'pending_review':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          Pending Review
        </span>
      )
    case 'in_progress':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          In Progress
        </span>
      )
    case 'auto_submitted_violation':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
          Violation
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 capitalize">
          {status.replace(/_/g, ' ')}
        </span>
      )
  }
}

interface AttemptsTableProps {
  testId: string
  attempts: AttemptListItem[]
}

export function AttemptsTable({ testId, attempts }: AttemptsTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Force submit handler
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
      const res = await forceSubmitAttemptAction(testId, attemptId)
      if (res.error) {
        setActionError(res.error)
      } else {
        setActionSuccess(`Attempt for "${studentName}" has been force submitted and graded.`)
        router.refresh()
      }
    })
  }

  // Delete attempt handler
  const handleDeleteAttempt = (attemptId: string, studentName: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete/void the attempt for "${studentName}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setActionError(null)
    setActionSuccess(null)
    startTransition(async () => {
      const res = await deleteAttemptAction(testId, attemptId)
      if (res.error) {
        setActionError(res.error)
      } else {
        setActionSuccess(`Attempt for "${studentName}" has been deleted.`)
        router.refresh()
      }
    })
  }

  // Regrade all handler
  const handleRegradeAll = () => {
    if (
      !confirm(
        'Regrading will recalculate scores for all submitted attempts using the latest question answer keys. Proceed?'
      )
    ) {
      return
    }

    setActionError(null)
    setActionSuccess(null)
    startTransition(async () => {
      const res = await regradeAllTestAttemptsAction(testId)
      if (res.error) {
        setActionError(res.error)
      } else {
        setActionSuccess(res.message || 'All attempts regraded successfully.')
        router.refresh()
      }
    })
  }

  // Filter logic
  const filteredAttempts = attempts.filter((att) => {
    const matchesSearch =
      att.studentName.toLowerCase().includes(search.toLowerCase()) ||
      (att.studentIdentifier &&
        att.studentIdentifier.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus =
      statusFilter === 'all' ? true : att.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
            Student Attempts ({attempts.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Individual exam submissions, real-time statuses, and score breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRegradeAll}
            disabled={isPending || attempts.length === 0}
            className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            Regrade All
          </Button>

          <a
            href={`/api/admin/tests/${testId}/export`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Notification banners */}
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

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto text-xs overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'pending_review', label: 'Pending Review' },
            { id: 'in_progress', label: 'In Progress' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-gray-900 shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Table Content */}
      {attempts.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-400">
          No students have taken this test yet.
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400">
          No attempts match your search or filter.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-y border-gray-100 bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-6">Student</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-center">Score</th>
                <th className="py-2.5 px-4 text-center">Result</th>
                <th className="py-2.5 px-4 text-center">Violations</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAttempts.map((att) => (
                <tr key={att.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Student info */}
                  <td className="py-3 px-6 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{att.studentName}</div>
                    {att.studentIdentifier && (
                      <div className="text-[11px] text-gray-400 font-mono">
                        ID: {att.studentIdentifier}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <AttemptStatusBadge status={att.status} />
                  </td>

                  {/* Score */}
                  <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                    {att.score !== null ? (
                      <div>
                        <span className="font-bold text-gray-900">{att.score}</span>
                        <span className="text-gray-400 text-[11px]"> / {att.maxScore}</span>
                        <div className="text-[11px] text-gray-500 font-sans">
                          {att.percentage}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  {/* Pass/Fail */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {att.isPassed === true ? (
                      <Badge variant="green" className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Pass
                      </Badge>
                    ) : att.isPassed === false ? (
                      <Badge variant="red" className="inline-flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Fail
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-[11px]">-</span>
                    )}
                  </td>

                  {/* Cheat violations */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {att.cheatEventCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        {att.cheatEventCount}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">0</span>
                    )}
                  </td>

                  {/* Duration */}
                  <td className="py-3 px-4 whitespace-nowrap text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {att.durationMinutes !== null
                        ? `${att.durationMinutes} min`
                        : att.status === 'in_progress'
                        ? 'Active now'
                        : '-'}
                    </div>
                  </td>

                  {/* Action buttons */}
                  <td className="py-3 px-6 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      {att.status === 'pending_review' && (
                        <Link
                          href={`/admin/tests/${testId}/attempts/${att.id}/grade`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] transition-colors shadow-xs"
                          title="Grade Essays"
                        >
                          <Award className="w-3 h-3" />
                          Grade
                        </Link>
                      )}

                      <Link
                        href={`/admin/tests/${testId}/attempts/${att.id}`}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                        title="View Detailed Attempt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>

                      {att.status === 'in_progress' && (
                        <button
                          onClick={() => handleForceSubmit(att.id, att.studentName)}
                          disabled={isPending}
                          className="px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors"
                          title="Force Submit active exam"
                        >
                          Force Submit
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteAttempt(att.id, att.studentName)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Delete / Void Attempt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
