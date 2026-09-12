import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Updates (refreshes) the Supabase session on every request.
 *
 * This is the recommended pattern from @supabase/ssr to keep sessions alive.
 * Must be called from middleware BEFORE any auth checks are made.
 *
 * Returns the (possibly refreshed) response and the current user,
 * so the calling middleware can make routing decisions based on auth state.
 *
 * IMPORTANT: Do not add any logic between createServerClient and getUser().
 * The cookie refresh only works correctly when these calls are adjacent.
 */
export async function updateSession(request: NextRequest) {
  // Start with a passthrough response — we'll modify cookies on it
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>
        ) {
          // First: update the request cookies (for subsequent middleware reads)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Recreate the response so updated request cookies flow through
          supabaseResponse = NextResponse.next({ request })
          // Set on the response so they reach the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add code between createServerClient and getUser().
  // Doing so may cause the session to not be refreshed correctly.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
