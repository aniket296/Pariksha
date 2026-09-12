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
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

let _adminClient: SupabaseClient<Database> | null = null

function getSupabaseAdmin(): SupabaseClient<Database> {
  if (_adminClient) return _adminClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    // Graceful fallback for static build analysis / page data collection
    return createClient<Database>(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseServiceRoleKey || 'placeholder-service-role-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }

  _adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return _adminClient
}

/**
 * Proxy singleton admin client — service role, bypasses RLS.
 * Lazily evaluates environment variables so that 'next build' succeeds
 * even before live Supabase credentials are provided in .env.local.
 */
export const supabaseAdmin: SupabaseClient<Database> = new Proxy(
  {} as SupabaseClient<Database>,
  {
    get(_target, prop) {
      const client = getSupabaseAdmin()
      const val = (client as unknown as Record<string, unknown>)[prop as string]
      if (typeof val === 'function') {
        return val.bind(client)
      }
      return val
    },
  }
)
