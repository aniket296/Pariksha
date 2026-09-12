'use client'

import type { ScoreBin } from '@/lib/actions/analytics'

interface ScoreHistogramProps {
  distribution: ScoreBin[]
  totalCount: number
}

export function ScoreHistogram({ distribution, totalCount }: ScoreHistogramProps) {
  const maxBinCount = Math.max(...distribution.map((d) => d.count), 1)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
          Score Distribution
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Breakdown of student test percentages across performance brackets.
        </p>
      </div>

      {totalCount === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400">
          No completed attempts yet.
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {distribution.map((bin) => {
            const barWidth = Math.round((bin.count / maxBinCount) * 100)
            return (
              <div key={bin.range} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 font-mono w-24">
                    {bin.range}
                  </span>
                  <span className="text-gray-500 font-medium">
                    {bin.count} {bin.count === 1 ? 'student' : 'students'}{' '}
                    <span className="text-gray-400 font-normal">({bin.percentage}%)</span>
                  </span>
                </div>

                <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

