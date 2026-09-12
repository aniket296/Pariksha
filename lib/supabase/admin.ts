/**
 * SERVER-ONLY: Supabase Admin Client
 *
 * SECURITY CRITICAL:
 *   - This module uses the SERVICE ROLE KEY which bypasses Row Level Security.
 *   - It MUST NEVER be imported in Client Components or any browser-executed code.
 *   - The 'server-only' import enforces this at build time.
 *
 * Use this client for:
 *   - Student API routes (entry, save, submit, violation) — students have no DB session
 *   - Admin operations that require bypassing RLS (regrading, results export)
 *   - The seed-admin.ts bootstrap script
 *
 * Do NOT use this client in:
 *   - Teacher dashboard reads (use lib/supabase/server.ts + RLS instead)
 *   - Any client-side code
 */
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error(
    '[pariksha] NEXT_PUBLIC_SUPABASE_URL is not set. ' +
    'Add it to .env.local.'
  )
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    '[pariksha] SUPABASE_SERVICE_ROLE_KEY is not set. ' +
    'Add it to .env.local. NEVER expose this key to the browser.'
  )
}

/**
 * Singleton admin client — service role, bypasses RLS.
 * Exported as a named constant (not a factory function) because it
 * does not manage session cookies and is safe to reuse across requests.
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      // No session persistence for the service-role client
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

