'use client'

import type { MatchingContent } from '@/lib/types/database'

interface MatchingRunnerProps {
  content: MatchingContent
  value: Record<string, string> | undefined
  onChange: (pairs: Record<string, string>) => void
  disabled?: boolean
}

export function MatchingRunner({
  content,
  value = {},
  onChange,
  disabled,
}: MatchingRunnerProps) {
  const leftItems = content.left_items || []
  const rightItems = content.right_items || []

  const handlePairChange = (leftId: string, targetId: string) => {
    onChange({
      ...value,
      [leftId]: targetId,
    })
  }

  return (
    <div className="space-y-6">
      {/* Available Targets Reference Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Matching Options (Targets)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {rightItems.map((rItem, idx) => (
            <div key={rItem.id} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-gray-200">
              <span className="font-bold text-brand-700 font-mono">
                {String.fromCharCode(65 + idx)}.
              </span>
              <span className="text-gray-800 leading-relaxed">{rItem.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Premises with Target Selection Dropdowns */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Match Each Item
        </h4>

        <div className="space-y-2.5">
          {leftItems.map((lItem, idx) => {
            const selectedTarget = value[lItem.id] || ''
            return (
              <div
                key={lItem.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 bg-white"
              >
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-xs font-bold text-gray-400 font-mono mt-0.5">
                    {idx + 1}.
                  </span>
                  <span className="text-sm font-medium text-gray-900 leading-relaxed">
                    {lItem.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:w-64">
                  <span className="text-xs text-gray-400 font-bold shrink-0">➔</span>
                  <select
                    disabled={disabled}
                    value={selectedTarget}
                    onChange={(e) => handlePairChange(lItem.id, e.target.value)}
                    className="w-full text-xs rounded-lg border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium cursor-pointer"
                  >
                    <option value="">-- Choose Match --</option>
                    {rightItems.map((rItem, rIdx) => (
                      <option key={rItem.id} value={rItem.id}>
                        {String.fromCharCode(65 + rIdx)}. {rItem.text}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

