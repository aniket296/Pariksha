-- =============================================================================
-- Pariksha Exam System — Migration 0002: Row Level Security Policies
-- =============================================================================
-- Security model (PART 2 of spec):
--
--   Teacher (authenticated):
--     - Full CRUD on their own tests, questions, attempts, responses, cheat_logs
--     - Authorization verified via: auth.uid() = tests.teacher_id
--
--   Students (anonymous / unauthenticated at DB level):
--     - NO direct table access
--     - ALL student operations go through server-side API routes
--     - API routes use the service-role client to perform operations
--     - The grading_key column is NEVER returned to students (API-layer + no anon RLS)
--
-- This means:
--   - anon role gets NO policies on any table (students cannot hit Supabase directly)
--   - All student data mutations happen via server-side API with service role
--   - Teacher role uses authenticated Supabase session with RLS policies below
-- =============================================================================

-- Enable RLS on all application tables
ALTER TABLE tests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheat_logs   ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (defense in depth)
ALTER TABLE tests        FORCE ROW LEVEL SECURITY;
ALTER TABLE questions    FORCE ROW LEVEL SECURITY;
ALTER TABLE attempts     FORCE ROW LEVEL SECURITY;
ALTER TABLE responses    FORCE ROW LEVEL SECURITY;
ALTER TABLE cheat_logs   FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- TESTS — Teacher policies
-- =============================================================================

-- Teacher can SELECT their own tests
CREATE POLICY "teacher_select_own_tests"
ON tests FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id);

-- Teacher can INSERT tests (teacher_id must match their auth.uid)
CREATE POLICY "teacher_insert_own_tests"
ON tests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = teacher_id);

-- Teacher can UPDATE their own tests
CREATE POLICY "teacher_update_own_tests"
ON tests FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Teacher can DELETE their own tests (cascades to questions/attempts/etc.)
CREATE POLICY "teacher_delete_own_tests"
ON tests FOR DELETE
TO authenticated
USING (auth.uid() = teacher_id);

-- =============================================================================
-- QUESTIONS — Teacher policies
-- Authorization via join to parent test (ownership chain)
-- NOTE: grading_key is never sent to students — enforced at API layer
-- =============================================================================

CREATE POLICY "teacher_select_own_questions"
ON questions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tests
        WHERE tests.id = questions.test_id
          AND tests.teacher_id = auth.uid()
    )
);

CREATE POLICY "teacher_insert_own_questions"
ON questions FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM tests
        WHERE tests.id = questions.test_id
          AND tests.teacher_id = auth.uid()
    )
);

CREATE POLICY "teacher_update_own_questions"
ON questions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tests
        WHERE tests.id = questions.test_id
          AND tests.teacher_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM tests
        WHERE tests.id = questions.test_id
          AND tests.teacher_id = auth.uid()
    )
);

CREATE POLICY "teacher_delete_own_questions"
ON questions FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tests
        WHERE tests.id = questions.test_id
          AND tests.teacher_id = auth.uid()
    )
);

-- =============================================================================
-- ATTEMPTS — Teacher policies
-- Authorization via join to parent test (ownership chain)
-- =============================================================================

CREATE POLICY "teacher_select_own_attempts"
ON attempts FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tests
        WHERE tests.id = attempts.test_id
          AND tests.teacher_id = auth.uid()
    )
);

CREATE POLICY "teacher_update_own_attempts"
ON attempts FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tests
        WHERE tests.id = attempts.test_id
          AND tests.teacher_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM tests
        WHERE tests.id = attempts.test_id
          AND tests.teacher_id = auth.uid()
    )
);

-- =============================================================================
-- RESPONSES — Teacher policies
-- Authorization via attempt → test ownership chain
-- =============================================================================

CREATE POLICY "teacher_select_own_responses"
ON responses FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM attempts a
        JOIN tests t ON t.id = a.test_id
        WHERE a.id = responses.attempt_id
          AND t.teacher_id = auth.uid()
    )
);

CREATE POLICY "teacher_update_own_responses"
ON responses FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM attempts a
        JOIN tests t ON t.id = a.test_id
        WHERE a.id = responses.attempt_id
          AND t.teacher_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM attempts a
        JOIN tests t ON t.id = a.test_id
        WHERE a.id = responses.attempt_id
          AND t.teacher_id = auth.uid()
    )
);

-- =============================================================================
-- CHEAT_LOGS — Teacher policies
-- Authorization via attempt → test ownership chain
-- =============================================================================

CREATE POLICY "teacher_select_own_cheat_logs"
ON cheat_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM attempts a
        JOIN tests t ON t.id = a.test_id
        WHERE a.id = cheat_logs.attempt_id
          AND t.teacher_id = auth.uid()
    )
);

-- =============================================================================
-- SECURITY NOTES
-- =============================================================================
-- 1. No anon (student) policies exist on any table.
--    Students cannot access Supabase directly.
--
-- 2. All student operations (entry, save, submit, violation) are mediated
--    through Next.js API routes that use the service-role client.
--    The service role bypasses RLS intentionally for server-side operations.
--
-- 3. The grading_key column in the questions table is NEVER included in
--    any student-facing query. This is enforced at the API layer by
--    explicitly selecting only safe columns.
--
-- 4. The session_token in the attempts table is generated server-side
--    using crypto.randomBytes(). Students cannot forge or modify it.
--
-- 5. FORCE ROW LEVEL SECURITY ensures even the table owner (postgres role)
--    goes through RLS policies, providing defense in depth.
-- =============================================================================
