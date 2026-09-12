import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js Middleware
 *
 * Responsibilities:
 *   1. Refresh Supabase session cookies on every request (keeps sessions alive)
 *   2. Protect all /admin/* routes — unauthenticated users are redirected to /admin/login
 *   3. Redirect authenticated users away from /admin/login to the dashboard
 *   4. Student routes (/t/*) and API routes (/api/*) pass through without auth requirements
 *
 * SECURITY: Server-side route protection (PART 2.1 of spec).
 * Client-side protection alone is insufficient and must never be the only guard.
 */

// Admin paths that do NOT require authentication (the login page itself)
const ADMIN_PUBLIC_PATHS: string[] = ['/admin/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Step 1: Always refresh the session (updates session cookies)
  const { supabaseResponse, user } = await updateSession(request)

  // Step 2: Protect /admin/* routes
  if (pathname.startsWith('/admin')) {
    const isPublicAdminPath = ADMIN_PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    )

    // Unauthenticated user accessing a protected admin page → redirect to login
    if (!isPublicAdminPath && !user) {
      const loginUrl = new URL('/admin/login', request.url)
      // Preserve the intended destination so we can redirect back after login
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Authenticated user accessing /admin/login → redirect to dashboard
    if (isPublicAdminPath && user) {
      const dashboardUrl = new URL('/admin/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // Student routes (/t/*) and all other routes pass through
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (Next.js static assets)
     * - _next/image   (Next.js image optimization)
     * - favicon.ico   (browser favicon)
     * - Static file extensions (images, fonts, etc.)
     *
     * This ensures middleware runs on page routes and API routes,
     * but not on static file serving (performance optimization).
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}

