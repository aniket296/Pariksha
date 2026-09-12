import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

/**
 * Creates a Supabase client for use in browser/client components.
 *
 * Uses ONLY public environment variables (NEXT_PUBLIC_*).
 * Safe to call in Client Components, hooks, and browser-side code.
 *
 * The anon key has limited permissions — all sensitive operations
 * are protected by RLS policies on the Supabase side.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

