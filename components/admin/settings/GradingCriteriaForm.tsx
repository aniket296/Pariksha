'use client'

import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

interface GradingCriteriaFormProps {
  passPercentage: number
  passMessage: string | null
  failMessage: string | null
  onChange: (fields: {
    pass_percentage: number
    pass_message: string | null
    fail_message: string | null
  }) => void
}

export function GradingCriteriaForm({
  passPercentage,
  passMessage,
  failMessage,
  onChange,
}: GradingCriteriaFormProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Grading & Pass/Fail Criteria
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Establish passing thresholds and custom feedback messages for students.
        </p>
      </div>

      {/* Passing percentage */}
      <div className="space-y-2 max-w-sm">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Passing Threshold (Percentage)
        </label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            max={100}
            value={passPercentage}
            onChange={(e) => {
              const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
              onChange({
                pass_percentage: val,
                pass_message: passMessage,
                fail_message: failMessage,
              })
            }}
            placeholder="50"
          />
          <span className="text-sm font-semibold text-gray-500">%</span>
        </div>
        <p className="text-xs text-gray-400">
          Students scoring {passPercentage}% or higher will be marked as Passed.
        </p>
      </div>

      {/* Custom Messages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Pass Message (Optional)
          </label>
          <Textarea
            rows={3}
            value={passMessage || ''}
            onChange={(e) =>
              onChange({
                pass_percentage: passPercentage,
                pass_message: e.target.value.trim() === '' ? null : e.target.value,
                fail_message: failMessage,
              })
            }
            placeholder="Congratulations on passing the exam! Your certificate has been recorded."
          />
          <span className="text-xs text-gray-400 mt-1 block">
            Displayed on the results screen when the student passes.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Fail Message (Optional)
          </label>
          <Textarea
            rows={3}
            value={failMessage || ''}
            onChange={(e) =>
              onChange({
                pass_percentage: passPercentage,
                pass_message: passMessage,
                fail_message: e.target.value.trim() === '' ? null : e.target.value,
              })
            }
            placeholder="You did not meet the passing threshold. Please review the material and consult your teacher."
          />
          <span className="text-xs text-gray-400 mt-1 block">
            Displayed on the results screen when the student fails.
          </span>
        </div>
      </div>
    </div>
  )
}
