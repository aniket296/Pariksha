'use client'

import { Input } from '@/components/ui/Input'

interface FillBlankRunnerProps {
  value: string | undefined
  onChange: (val: string) => void
  disabled?: boolean
}

export function FillBlankRunner({
  value = '',
  onChange,
  disabled,
}: FillBlankRunnerProps) {
  return (
    <div className="max-w-md">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Your Answer
      </label>
      <Input
        type="text"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer here..."
        className="text-base py-2.5"
      />
    </div>
  )
}

