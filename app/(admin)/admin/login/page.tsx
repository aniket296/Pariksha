import type { Metadata } from 'next'
import { LoginForm } from '@/components/admin/LoginForm'

export const metadata: Metadata = {
  title: 'Sign In',
  // Prevent search engine indexing of the admin login page
  robots: { index: false, follow: false },
}

/**
 * Admin login page — uses the root layout only (no admin nav shell).
 * Middleware redirects authenticated users away from this page.
 */
export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12"
      aria-labelledby="login-heading"
    >
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white mb-4 shadow-sm"
            aria-hidden="true"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
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
          </div>
          <h1
            id="login-heading"
            className="text-2xl font-bold text-gray-900"
          >
            Pariksha
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Exam Management System
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">
            Sign in to your account
          </h2>
          <LoginForm />
        </div>

        {/* Student hint */}
        <p className="mt-5 text-center text-xs text-gray-400">
          Are you a student?{' '}
          <span className="text-gray-500 font-medium">
            Access your exam at <code className="font-mono">/t/[test-code]</code>
          </span>
        </p>
      </div>
    </main>
  )
}
