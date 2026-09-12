import { cn } from '@/lib/utils/cn'
import type { TestStatus } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// StatusBadge — for test status (draft / published / archived)
// ---------------------------------------------------------------------------

const statusConfig: Record<
  TestStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 border border-gray-200',
  },
  published: {
    label: 'Published',
    className: 'bg-green-100 text-green-800 border border-green-200',
  },
  archived: {
    label: 'Archived',
    className: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
}

export interface StatusBadgeProps {
  status: TestStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Generic Badge (for counts, labels, etc.)
// ---------------------------------------------------------------------------

export type BadgeVariant = 'default' | 'blue' | 'green' | 'red' | 'amber'

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 border border-gray-200',
  blue: 'bg-blue-100 text-blue-800 border border-blue-200',
  green: 'bg-green-100 text-green-800 border border-green-200',
  red: 'bg-red-100 text-red-800 border border-red-200',
  amber: 'bg-amber-100 text-amber-800 border border-amber-200',
}

export interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
