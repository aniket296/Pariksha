import Link from 'next/link'
import { logoutAction } from '@/lib/actions/auth'

interface AdminTopNavProps {
  userEmail: string
}

/**
 * Top navigation bar for the admin shell.
 *
 * Logout uses a <form> with a Server Action — no client-side JS required.
 * Fully keyboard-navigable (PART 37).
 */
export function AdminTopNav({ userEmail }: AdminTopNavProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-brand-700 font-bold text-lg hover:text-brand-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded"
            aria-label="Pariksha — Go to dashboard"
          >
            {/* Simple inline SVG logo mark */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="text-brand-600"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="3"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M7 9h10M7 12h6M7 15h8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>Pariksha</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Teacher email — hidden on very small screens */}
            <span
              className="hidden sm:block text-sm text-gray-500 truncate max-w-[200px]"
              title={userEmail}
              aria-label={`Signed in as ${userEmail}`}
            >
              {userEmail}
            </span>

            {/* Logout form — works without JS (progressive enhancement) */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="
                  text-sm font-medium text-gray-600
                  hover:text-gray-900 hover:bg-gray-100
                  px-3 py-1.5 rounded-md
                  transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-brand-500 focus-visible:ring-offset-2
                "
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
