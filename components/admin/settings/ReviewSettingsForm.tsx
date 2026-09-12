'use client'

import type { ReviewConfig } from '@/lib/types/database'

interface ReviewSettingsFormProps {
  config: ReviewConfig
  onChange: (newConfig: ReviewConfig) => void
}

export function ReviewSettingsForm({
  config,
  onChange,
}: ReviewSettingsFormProps) {
  const updateField = (key: keyof ReviewConfig, val: boolean) => {
    onChange({ ...config, [key]: val })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="text-base font-semibold text-gray-900">
            Post-Exam Review & Results Disclosure
          </h3>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Control what information students see immediately after submitting their exam.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Show Score */}
        <label className="flex items-start gap-3 p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/40 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={config.show_score}
            onChange={(e) => updateField('show_score', e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300 mt-0.5"
          />
          <div>
            <span className="text-xs font-semibold text-gray-900 block">
              Show Total Score & Percentage
            </span>
            <span className="text-xs text-gray-500 block mt-0.5">
              Displays the student&apos;s overall score, total possible points, percentage, and Pass/Fail status.
            </span>
          </div>
        </label>

        {/* Show Breakdown */}
        <label className="flex items-start gap-3 p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/40 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={config.show_breakdown}
            onChange={(e) => updateField('show_breakdown', e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300 mt-0.5"
          />
          <div>
            <span className="text-xs font-semibold text-gray-900 block">
              Show Per-Question Points Breakdown
            </span>
            <span className="text-xs text-gray-500 block mt-0.5">
              Shows how many points were earned or deducted for each question.
            </span>
          </div>
        </label>

        {/* Show Correct Answers */}
        <label className="flex items-start gap-3 p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/40 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={config.show_correct_answers}
            onChange={(e) => updateField('show_correct_answers', e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300 mt-0.5"
          />
          <div>
            <span className="text-xs font-semibold text-gray-900 block">
              Reveal Correct Answers
            </span>
            <span className="text-xs text-gray-500 block mt-0.5">
              Highlights the correct answer next to the student&apos;s answer (disable for high-stakes exams).
            </span>
          </div>
        </label>

        {/* Show Explanations */}
        <label className="flex items-start gap-3 p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/40 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={config.show_explanations}
            onChange={(e) => updateField('show_explanations', e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300 mt-0.5"
          />
          <div>
            <span className="text-xs font-semibold text-gray-900 block">
              Show Explanations / Solutions
            </span>
            <span className="text-xs text-gray-500 block mt-0.5">
              Displays teacher explanations and notes associated with each question.
            </span>
          </div>
        </label>
      </div>
    </div>
  )
}
