'use client'

import { Input } from '@/components/ui/Input'
import type { LayoutStyle } from '@/lib/types/database'

interface TimingPresentationFormProps {
  timeLimitMins: number
  layoutStyle: LayoutStyle
  onChange: (fields: {
    time_limit_mins: number
    layout_style: LayoutStyle
  }) => void
}

export function TimingPresentationForm({
  timeLimitMins,
  layoutStyle,
  onChange,
}: TimingPresentationFormProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Timing & Question Presentation
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure the exam duration and student layout style.
        </p>
      </div>

      {/* Time Limit */}
      <div className="space-y-2 max-w-sm">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Time Limit (Minutes)
        </label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            value={timeLimitMins}
            onChange={(e) =>
              onChange({
                time_limit_mins: Math.max(0, parseInt(e.target.value) || 0),
                layout_style: layoutStyle,
              })
            }
            placeholder="0"
          />
          <span className="text-sm text-gray-500 shrink-0">minutes</span>
        </div>
        <p className="text-xs text-gray-400">
          {timeLimitMins === 0
            ? '0 = No time limit (untimed examination).'
            : `Students will have a countdown timer of ${timeLimitMins} minutes.`}
        </p>
      </div>

      {/* Question Layout Style */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Question Presentation Mode
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Single Page */}
          <label
            className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${
              layoutStyle === 'single_page'
                ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📜</span>
                <span className="text-sm font-semibold text-gray-900">Single Page</span>
              </div>
              <input
                type="radio"
                name="layout_style"
                checked={layoutStyle === 'single_page'}
                onChange={() =>
                  onChange({
                    time_limit_mins: timeLimitMins,
                    layout_style: 'single_page',
                  })
                }
                className="text-brand-600 focus:ring-brand-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              All questions appear on a single scrollable page. Students can review and answer in any order before submitting.
            </p>
          </label>

          {/* One-by-One */}
          <label
            className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${
              layoutStyle === 'one_by_one'
                ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📑</span>
                <span className="text-sm font-semibold text-gray-900">One Question at a Time</span>
              </div>
              <input
                type="radio"
                name="layout_style"
                checked={layoutStyle === 'one_by_one'}
                onChange={() =>
                  onChange({
                    time_limit_mins: timeLimitMins,
                    layout_style: 'one_by_one',
                  })
                }
                className="text-brand-600 focus:ring-brand-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              One question displayed per page with Previous and Next navigation buttons and a question overview palette.
            </p>
          </label>
        </div>
      </div>
    </div>
  )
}
