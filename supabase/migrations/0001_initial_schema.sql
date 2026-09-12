-- =============================================================================
-- Pariksha Exam System — Migration 0001: Initial Schema
-- =============================================================================
-- Run this against your Supabase project via:
--   1. Supabase Dashboard > SQL Editor, OR
--   2. supabase db push (if using Supabase CLI with local dev)
-- =============================================================================

-- Ensure UUID generation is available (built-in to Supabase/PostgreSQL 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- Automatically sets updated_at to now() on every UPDATE.
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLE: tests
-- One row per exam created by the teacher.
-- =============================================================================
CREATE TABLE IF NOT EXISTS tests (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Single-tenant: all tests belong to the one teacher account
    teacher_id        UUID        NOT NULL
                                  REFERENCES auth.users(id)
                                  ON DELETE CASCADE,

    title             TEXT        NOT NULL,
    description       TEXT,

    -- Optional passcode; NULL means no passcode required
    passcode          TEXT,

    status            TEXT        NOT NULL
                                  DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'published', 'archived')),

    -- NULL open_at = open immediately when published
    open_at           TIMESTAMPTZ,
    -- NULL close_at = no automatic close
    close_at          TIMESTAMPTZ,

    -- 0 = no time limit
    time_limit_mins   INT         NOT NULL DEFAULT 0,

    -- 0 = unlimited attempts
    max_attempts      INT         NOT NULL DEFAULT 1,

    pass_percentage   NUMERIC(5,2) NOT NULL DEFAULT 60.00,

    pass_message      TEXT        DEFAULT 'Congratulations! You passed.',
    fail_message      TEXT        DEFAULT 'You did not meet the passing grade.',

    layout_style      TEXT        NOT NULL
                                  DEFAULT 'single_page'
                                  CHECK (layout_style IN ('single_page', 'one_by_one')),

    access_type       TEXT        NOT NULL
                                  DEFAULT 'name_only'
                                  CHECK (access_type IN ('name_only', 'name_and_id', 'whitelist')),

    -- JSON array of whitelisted student entries:
    -- [{ "name": "...", "identifier": "..." }] for whitelist access
    whitelist_data    JSONB       DEFAULT '[]'::jsonb,

    -- Anti-cheat feature flags (see PART 15–19 of spec)
    anti_cheat_config JSONB       NOT NULL DEFAULT '{
        "detect_tab_switch": true,
        "enforce_fullscreen": true,
        "block_clipboard": true,
        "max_violations": 3,
        "auto_submit_on_limit": true,
        "allow_resume": true
    }'::jsonb,

    -- Controls what students see after submission (see PART 28 of spec)
    review_config     JSONB       NOT NULL DEFAULT '{
        "show_score": true,
        "show_breakdown": true,
        "show_correct_answers": true,
        "show_explanations": true
    }'::jsonb,

    shuffle_questions BOOLEAN     NOT NULL DEFAULT false,
    shuffle_options   BOOLEAN     NOT NULL DEFAULT false,

    -- NULL = all questions; >= 1 = pick N from non-pinned pool
    pool_pick_count   INT         DEFAULT NULL,

    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- -------------------------------------------------------------------------
    -- Integrity constraints (PART 5 of spec)
    -- -------------------------------------------------------------------------
    CONSTRAINT tests_max_attempts_non_negative
        CHECK (max_attempts >= 0),

    CONSTRAINT tests_time_limit_non_negative
        CHECK (time_limit_mins >= 0),

    CONSTRAINT tests_pass_percentage_range
        CHECK (pass_percentage >= 0 AND pass_percentage <= 100),

    CONSTRAINT tests_pool_pick_count_positive
        CHECK (pool_pick_count IS NULL OR pool_pick_count >= 1),

    -- close_at must be after open_at when both are set
    CONSTRAINT tests_schedule_order
        CHECK (open_at IS NULL OR close_at IS NULL OR close_at > open_at)
);

-- Auto-update updated_at on tests
CREATE TRIGGER tests_updated_at
    BEFORE UPDATE ON tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: questions
-- One row per question belonging to a test.
-- SECURITY: grading_key column must NEVER be returned to students.
-- =============================================================================
CREATE TABLE IF NOT EXISTS questions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    test_id         UUID        NOT NULL
                                REFERENCES tests(id)
                                ON DELETE CASCADE,

    -- Display order; can be overridden by shuffle at attempt-creation time
    order_index     INT         NOT NULL DEFAULT 0,

    type            TEXT        NOT NULL
                                CHECK (type IN (
                                    'mcq_single',
                                    'mcq_multi',
                                    'true_false',
                                    'fill_blank',
                                    'essay',
                                    'matching'
                                )),

    prompt          TEXT        NOT NULL,

    -- Points awarded for a fully correct answer
    points          NUMERIC(6,2) NOT NULL DEFAULT 1.00,

    -- Points deducted for an incorrect answer (set to 0 for no negative marking)
    negative_points NUMERIC(6,2) NOT NULL DEFAULT 0.00,

    -- Pinned questions are always included regardless of pool_pick_count
    is_pinned       BOOLEAN     NOT NULL DEFAULT false,

    -- Question-type-specific data (choices, items, etc.) — see PART 6
    content         JSONB       NOT NULL DEFAULT '{}'::jsonb,

    -- SECURITY CRITICAL: Contains correct answers / accepted values.
    -- This column MUST NEVER be returned in student-facing API responses.
    -- Enforced at the API layer and by RLS (students have no direct table access).
    grading_key     JSONB       NOT NULL DEFAULT '{}'::jsonb,

    -- Optional explanation shown to students after submission (if review_config allows)
    explanation     TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- -------------------------------------------------------------------------
    -- Integrity constraints
    -- -------------------------------------------------------------------------
    CONSTRAINT questions_points_non_negative
        CHECK (points >= 0),

    CONSTRAINT questions_negative_points_non_negative
        CHECK (negative_points >= 0)
);

-- =============================================================================
-- TABLE: attempts
-- One row per student examination attempt.
-- session_token is used to authenticate subsequent student API requests.
-- =============================================================================
CREATE TABLE IF NOT EXISTS attempts (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    test_id               UUID        NOT NULL
                                      REFERENCES tests(id)
                                      ON DELETE CASCADE,

    student_name          TEXT        NOT NULL,

    -- NULL for name_only access type (identifier not collected)
    student_identifier    TEXT,

    started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at          TIMESTAMPTZ,

    status                TEXT        NOT NULL
                                      DEFAULT 'in_progress'
                                      CHECK (status IN (
                                          'in_progress',
                                          'submitted',
                                          'pending_review',
                                          'auto_submitted_violation',
                                          'timed_out'
                                      )),

    -- Score fields; NULL until grading is complete
    score                 NUMERIC(8,2) DEFAULT NULL,
    max_score             NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    percentage            NUMERIC(5,2) DEFAULT NULL,
    is_passed             BOOLEAN      DEFAULT NULL,

    -- JSON array of question UUIDs assigned to this attempt (persisted at creation)
    -- Once set, MUST NOT change for the lifetime of the attempt (PART 8)
    assigned_question_ids JSONB        NOT NULL DEFAULT '[]'::jsonb,

    -- Secure opaque token issued to the student's browser session.
    -- Used to authenticate autosave, violation, and submit API calls.
    -- UNIQUE enforced at DB level.
    session_token         TEXT         UNIQUE,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- TABLE: responses
-- One row per (attempt, question) pair.
-- The UNIQUE constraint prevents duplicate responses for the same question.
-- =============================================================================
CREATE TABLE IF NOT EXISTS responses (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    attempt_id      UUID        NOT NULL
                                REFERENCES attempts(id)
                                ON DELETE CASCADE,

    question_id     UUID        NOT NULL
                                REFERENCES questions(id)
                                ON DELETE CASCADE,

    -- The student's submitted answer in question-type-specific JSON format
    student_answer  JSONB       NOT NULL DEFAULT 'null'::jsonb,

    -- NULL until the question is graded (essay = manually graded later)
    awarded_points  NUMERIC(6,2) DEFAULT NULL,

    -- NULL for essay questions until manually graded
    is_correct      BOOLEAN     DEFAULT NULL,

    -- Teacher feedback for essay questions
    teacher_comment TEXT        DEFAULT NULL,

    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Prevent duplicate responses for the same (attempt, question) pair
    -- Spec PART 4.4 requirement: CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

-- Auto-update updated_at on responses
CREATE TRIGGER responses_updated_at
    BEFORE UPDATE ON responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: cheat_logs
-- Records anti-cheat violation events during a student attempt.
-- =============================================================================
CREATE TABLE IF NOT EXISTS cheat_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    attempt_id      UUID        NOT NULL
                                REFERENCES attempts(id)
                                ON DELETE CASCADE,

    event_type      TEXT        NOT NULL
                                CHECK (event_type IN (
                                    'tab_switch',
                                    'fullscreen_exit',
                                    'copy_attempt',
                                    'paste_attempt',
                                    'context_menu'
                                )),

    -- Number of times this specific event has occurred in this session
    -- The server calculates the authoritative count; this is a snapshot at log time
    violation_count INT         NOT NULL DEFAULT 1,

    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

