#!/usr/bin/env tsx
/**
 * Pariksha — Admin Account Bootstrap Script
 * ==========================================
 * Creates the single teacher/admin account for the exam system.
 *
 * SECURITY:
 *   - Uses the Supabase Service Role Key (bypasses RLS)
 *   - Must ONLY be run from a trusted environment (local machine, CI/CD)
 *   - NEVER run this in the browser or expose it as an API endpoint
 *   - Credentials are read from environment variables ONLY (never hardcoded)
 *
 * USAGE:
 *   1. Fill in .env.local with the required variables (see .env.local.example)
 *   2. Run: npm run seed:admin
 *
 * REQUIRED ENVIRONMENT VARIABLES:
 *   NEXT_PUBLIC_SUPABASE_URL   — Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — Service role key (keep secret!)
 *   ADMIN_EMAIL                — Teacher account email
 *   ADMIN_PASSWORD             — Teacher account password (min 8 chars)
 *
 * IDEMPOTENT: Safe to run multiple times. If the account already exists,
 * it reports success and makes no changes.
 */

import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Environment validation
// ---------------------------------------------------------------------------

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    console.error(`❌ Missing required environment variable: ${name}`)
    console.error(`   Add it to your .env.local file.`)
    process.exit(1)
  }
  return value.trim()
}

const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL')
const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
const adminEmail = getRequiredEnv('ADMIN_EMAIL')
const adminPassword = getRequiredEnv('ADMIN_PASSWORD')

if (adminPassword.length < 8) {
  console.error('❌ ADMIN_PASSWORD must be at least 8 characters long.')
  console.error('   Use a strong password with mixed characters for security.')
  process.exit(1)
}

if (!adminEmail.includes('@')) {
  console.error('❌ ADMIN_EMAIL does not appear to be a valid email address.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seedAdmin(): Promise<void> {
  console.log('')
  console.log('🎓 Pariksha — Admin Account Bootstrap')
  console.log('══════════════════════════════════════')
  console.log(`📧 Email:   ${adminEmail}`)
  console.log(`🌐 Project: ${supabaseUrl}`)
  console.log('')

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // -------------------------------------------------------------------------
  // Check for existing admin account (idempotency)
  // -------------------------------------------------------------------------
  console.log('🔍 Checking for existing admin account...')

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  })

  if (listError) {
    console.error('❌ Failed to list users:')
    console.error(`   ${listError.message}`)
    console.error('')
    console.error('   Possible causes:')
    console.error('   - Invalid SUPABASE_SERVICE_ROLE_KEY')
    console.error('   - Invalid NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - Network connectivity issue')
    process.exit(1)
  }

  const existingUser = listData.users.find(
    (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
  )

  if (existingUser) {
    console.log('✅ Admin account already exists — no changes made.')
    console.log(`   ID:         ${existingUser.id}`)
    console.log(`   Email:      ${existingUser.email ?? '(no email)'}`)
    console.log(`   Created:    ${existingUser.created_at}`)
    console.log(`   Confirmed:  ${existingUser.email_confirmed_at ? 'yes' : 'no'}`)
    console.log('')
    console.log('ℹ️  To reset the password, use the Supabase dashboard or run')
    console.log('   supabase.auth.admin.updateUserById() with a new password.')
    process.exit(0)
  }

  // -------------------------------------------------------------------------
  // Create the admin user
  // -------------------------------------------------------------------------
  console.log('🔐 Creating admin account...')

  const { data: createData, error: createError } =
    await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      // Skip email verification — this is the only account, managed by the teacher
      email_confirm: true,
      user_metadata: {
        role: 'teacher',
        system: 'pariksha',
      },
    })

  if (createError) {
    console.error('❌ Failed to create admin account:')
    console.error(`   ${createError.message}`)
    process.exit(1)
  }

  console.log('')
  console.log('✅ Admin account created successfully!')
  console.log(`   ID:    ${createData.user.id}`)
  console.log(`   Email: ${createData.user.email ?? adminEmail}`)
  console.log('')
  console.log('⚠️  SECURITY REMINDERS:')
  console.log('   • Store your password in a password manager')
  console.log('   • Do NOT commit ADMIN_PASSWORD to version control')
  console.log('   • Remove ADMIN_PASSWORD from .env.local after bootstrapping')
  console.log('     (or keep it only if you need to re-run this script)')
  console.log('')
  console.log('🚀 Next steps:')
  console.log('   1. Copy your Supabase credentials to .env.local')
  console.log('   2. Apply SQL migrations via the Supabase SQL Editor:')
  console.log('      supabase/migrations/0001_initial_schema.sql')
  console.log('      supabase/migrations/0002_rls_policies.sql')
  console.log('      supabase/migrations/0003_indexes.sql')
  console.log('   3. Run: npm run dev')
  console.log('   4. Visit: http://localhost:3000/admin/login')
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

seedAdmin().catch((err: unknown) => {
  console.error('❌ Unexpected error during seed:')
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

