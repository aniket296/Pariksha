'use client'

import { useState } from 'react'
import type { QuestionAnalysis } from '@/lib/actions/analytics'
import { Badge } from '@/components/ui/Badge'
import { Search } from 'lucide-react'

interface ItemAnalysisTableProps {
  items: QuestionAnalysis[]
}

const TYPE_LABELS: Record<string, string> = {
  mcq_single: 'Single Choice',
  mcq_multi: 'Multi Choice',
  true_false: 'True / False',
  fill_blank: 'Fill in Blank',
  essay: 'Essay',
  matching: 'Matching',
}

export function ItemAnalysisTable({ items }: ItemAnalysisTableProps) {
  const [search, setSearch] = useState('')

  const filteredItems = items.filter(
    (item) =>
      item.prompt.toLowerCase().includes(search.toLowerCase()) ||
      (TYPE_LABELS[item.type] || item.type).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
            Item Difficulty & Performance Analysis
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Per-question breakdown of average student scores and difficulty classifications.
          </p>
        </div>

        {items.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center text-xs text-gray-400">
          No question responses available for item analysis.
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400">
          No questions match your search.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-y border-gray-100 bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-6">#</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Question Prompt</th>
                <th className="py-2.5 px-4 text-center">Max Pts</th>
                <th className="py-2.5 px-4 text-center">Avg Score</th>
                <th className="py-2.5 px-4 text-center">% Correct</th>
                <th className="py-2.5 px-6 text-right">Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((q) => (
                <tr key={q.questionId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-6 font-mono text-gray-400 font-bold">
                    Q{q.orderIndex + 1}
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-medium whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-[10px] text-gray-700 font-medium">
                      {TYPE_LABELS[q.type] || q.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs md:max-w-md">
                    <p className="line-clamp-2 text-gray-800 font-normal">
                      {q.prompt}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-gray-700">
                    {q.maxPoints}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-medium text-gray-900">
                    {q.averageScore}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            q.correctPercentage >= 70
                              ? 'bg-emerald-500'
                              : q.correctPercentage >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${q.correctPercentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-gray-600 w-8 text-right">
                        {q.correctPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-right whitespace-nowrap">
                    {q.difficulty === 'Easy' && (
                      <Badge variant="green">Easy</Badge>
                    )}
                    {q.difficulty === 'Moderate' && (
                      <Badge variant="amber">Moderate</Badge>
                    )}
                    {q.difficulty === 'Hard' && (
                      <Badge variant="red">Hard</Badge>
                    )}
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
