import type { Metadata } from 'next'
import Link from 'next/link'
import { NewTestForm } from '@/components/admin/NewTestForm'

export const metadata: Metadata = { title: 'New Test' }

export default function NewTestPage() {
  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li>
            <Link
              href="/admin/dashboard"
              className="hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true" className="text-gray-300">
            /
          </li>
          <li className="text-gray-900 font-medium" aria-current="page">
            New Test
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Create a new test
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Start with a title. You can add questions, settings, and a passcode
        after the test is created.
      </p>

      {/* Form card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <NewTestForm />
      </div>
    </div>
  )
}
