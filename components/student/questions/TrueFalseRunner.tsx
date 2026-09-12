'use client'

interface TrueFalseRunnerProps {
  value: 'true' | 'false' | undefined
  onChange: (val: 'true' | 'false') => void
  disabled?: boolean
}

export function TrueFalseRunner({
  value,
  onChange,
  disabled,
}: TrueFalseRunnerProps) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-sm" role="radiogroup">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('true')}
        className={`flex items-center justify-center gap-2.5 p-4 rounded-xl border text-sm font-semibold transition-all ${
          value === 'true'
            ? 'border-brand-600 bg-brand-50 text-brand-800 ring-2 ring-brand-500/20 shadow-sm'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        aria-pressed={value === 'true'}
      >
        <span className="text-base">✓</span> True
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('false')}
        className={`flex items-center justify-center gap-2.5 p-4 rounded-xl border text-sm font-semibold transition-all ${
          value === 'false'
            ? 'border-brand-600 bg-brand-50 text-brand-800 ring-2 ring-brand-500/20 shadow-sm'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        aria-pressed={value === 'false'}
      >
        <span className="text-base">✗</span> False
      </button>
    </div>
  )
}

