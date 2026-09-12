import Link from 'next/link'
import { StatusBadge } from '@/components/ui/Badge'
import type { TestStatus } from '@/lib/types/database'
import {
  FileQuestion,
  Settings,
  Activity,
  BarChart3,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'

interface TestNavHeaderProps {
  testId: string
  testTitle: string
  status: TestStatus
  activeTab: 'questions' | 'settings' | 'monitor' | 'results'
}

export function TestNavHeader({
  testId,
  testTitle,
  status,
  activeTab,
}: TestNavHeaderProps) {
  const tabs = [
    {
      id: 'questions',
      label: 'Questions',
      href: `/admin/tests/${testId}/edit`,
      icon: FileQuestion,
    },
    {
      id: 'settings',
      label: 'Settings',
      href: `/admin/tests/${testId}/settings`,
      icon: Settings,
    },
    {
      id: 'monitor',
      label: 'Live Monitor',
      href: `/admin/tests/${testId}/monitor`,
      icon: Activity,
    },
    {
      id: 'results',
      label: 'Results & Analytics',
      href: `/admin/tests/${testId}/results`,
      icon: BarChart3,
    },
  ]

  return (
    <div className="space-y-4 mb-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs text-gray-500">
          <li>
            <Link
              href="/admin/dashboard"
              className="hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
          </li>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <li className="text-gray-900 font-medium truncate max-w-[240px]">
            {testTitle}
          </li>
        </ol>
      </nav>

      {/* Main Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight truncate">
              {testTitle}
            </h1>
            <StatusBadge status={status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Test ID: <span className="font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{testId}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/t/${testId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-xs transition-colors"
          >
            <span>Student Link</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 overflow-x-auto -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
