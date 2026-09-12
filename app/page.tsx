import { redirect } from 'next/navigation'

/**
 * Root page — no public landing.
 * Redirect teacher to login; Phase 2 will implement the full login UI.
 * Students access tests directly at /t/[testId].
 */
export default function RootPage() {
  redirect('/admin/login')
}
