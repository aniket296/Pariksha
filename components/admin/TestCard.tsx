import Link from 'next/link'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  archiveTestAction,
  restoreTestAction,
  deleteTestAction,
} from '@/lib/actions/tests'
import type { Database } from '@/lib/types/database'

type Test = Database['public']['Tables']['tests']['Row']

interface TestCardProps {
  test: Test
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Test card displayed on the admin dashboard.
 * Server Component — uses bound Server Actions as form actions.
 * Actions: Edit (link), Archive/Restore (form), Delete (form, draft-only).
 */
export function TestCard({ test }: TestCardProps) {
  const archiveWithId = archiveTestAction.bind(null, test.id)
  const restoreWithId = restoreTestAction.bind(null, test.id)
  const deleteWithId = deleteTestAction.bind(null, test.id)

  return (
    <article
      className="
        bg-white rounded-lg border border-gray-200
        shadow-sm hover:shadow-md hover:border-gray-300
        transition-all duration-150
        flex flex-col
      "
      aria-label={`Test: ${test.title}`}
    >
      {/* Card body */}
      <div className="p-5 flex-1">
        {/* Title + badge row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">
            {test.title}
          </h3>
          <StatusBadge status={test.status} className="flex-shrink-0 mt-0.5" />
        </div>

        {/* Description */}
        {test.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {test.description}
          </p>
        )}

        {/* Meta info */}
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
          <div className="flex gap-1">
            <dt className="sr-only">Layout</dt>
            <dd className="capitalize">
              {test.layout_style === 'single_page' ? 'Single page' : 'One by one'}
            </dd>
          </div>
          {test.time_limit_mins > 0 && (
            <div className="flex gap-1">
              <dt className="sr-only">Time limit</dt>
              <dd>{test.time_limit_mins} min</dd>
            </div>
          )}
          <div className="flex gap-1">
            <dt className="sr-only">Created</dt>
            <dd>Created {formatDate(test.created_at)}</dd>
          </div>
        </dl>
      </div>

      {/* Actions row */}
      <div
        className="
          px-5 py-3 border-t border-gray-100
          flex flex-wrap items-center gap-2
          bg-gray-50 rounded-b-lg
        "
      >
        {/* Edit — always available */}
        <Link
          href={`/admin/tests/${test.id}/edit`}
          className="
            inline-flex items-center h-7 px-2.5 text-xs font-medium rounded
            bg-brand-600 text-white
            hover:bg-brand-700 transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-brand-500 focus-visible:ring-offset-1
          "
        >
          Edit
        </Link>

        {/* Archive — for non-archived tests */}
        {test.status !== 'archived' && (
          <form action={archiveWithId}>
            <Button type="submit" variant="secondary" size="sm">
              Archive
            </Button>
          </form>
        )}

        {/* Restore — for archived tests */}
        {test.status === 'archived' && (
          <form action={restoreWithId}>
            <Button type="submit" variant="secondary" size="sm">
              Restore
            </Button>
          </form>
        )}

        {/* Delete — draft tests only */}
        {test.status === 'draft' && (
          <form action={deleteWithId}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              aria-label={`Delete draft test: ${test.title}`}
            >
              Delete
            </Button>
          </form>
        )}
      </div>
    </article>
  )
}
