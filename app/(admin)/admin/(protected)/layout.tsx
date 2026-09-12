import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminTopNav } from '@/components/admin/AdminTopNav'

/**
 * Protected admin layout — wraps all admin pages EXCEPT /admin/login.
 * Located at app/(admin)/admin/(protected)/layout.tsx
 *
 * Route group (protected) does not appear in the URL:
 *   /admin/dashboard, /admin/tests/*, etc.
 *
 * Defense-in-depth auth check (middleware is the primary guard).
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated requests (middleware handles this too)
  if (!user) {
    redirect('/admin/login')
  }

  const userEmail = user.email ?? 'Admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminTopNav userEmail={userEmail} />
      <main
        id="main-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {children}
      </main>
    </div>
  )
}
