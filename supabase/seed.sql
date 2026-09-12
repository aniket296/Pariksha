-- =============================================================================
-- Pariksha Exam System — Supabase Seed
-- =============================================================================
-- This file contains one-time setup SQL that should be run after migrations.
-- The teacher account is created via the seed-admin.ts script (not SQL),
-- because Supabase Auth user creation requires the admin API.
--
-- Usage:
--   1. Apply migrations 0001, 0002, 0003 first (via SQL Editor or supabase push)
--   2. Run: npm run seed:admin
--      (requires .env.local with SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD)
-- =============================================================================

-- This seed file intentionally has no data inserts.
-- All bootstrap actions are performed by scripts/seed-admin.ts via the Admin API.

-- Confirm extensions are active
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pgcrypto', 'uuid-ossp');
