import { type LabelHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

/**
 * Form label with optional required indicator.
 * The asterisk is aria-hidden — required state is communicated
 * via the associated input's required attribute instead.
 */
export function Label({
  className,
  children,
  required,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn(
        'block text-sm font-medium text-gray-700 mb-1',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span
          className="ml-0.5 text-red-500"
          aria-hidden="true"
          title="Required"
        >
          *
        </span>
      )}
    </label>
  )
}
