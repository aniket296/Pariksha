-- =============================================================================
-- Pariksha Exam System — Migration 0003: Performance Indexes
-- =============================================================================

-- TESTS
CREATE INDEX IF NOT EXISTS idx_tests_teacher_id
    ON tests(teacher_id);

CREATE INDEX IF NOT EXISTS idx_tests_status
    ON tests(status);

CREATE INDEX IF NOT EXISTS idx_tests_teacher_status
    ON tests(teacher_id, status);

-- QUESTIONS
CREATE INDEX IF NOT EXISTS idx_questions_test_id
    ON questions(test_id);

-- Ordered fetch for question display
CREATE INDEX IF NOT EXISTS idx_questions_test_order
    ON questions(test_id, order_index);

-- Pool selection: find pinned questions quickly
CREATE INDEX IF NOT EXISTS idx_questions_test_pinned
    ON questions(test_id, is_pinned);

-- ATTEMPTS
CREATE INDEX IF NOT EXISTS idx_attempts_test_id
    ON attempts(test_id);

-- Session lookup (hot path: every student API call validates session_token)
CREATE INDEX IF NOT EXISTS idx_attempts_session_token
    ON attempts(session_token);

CREATE INDEX IF NOT EXISTS idx_attempts_status
    ON attempts(status);

CREATE INDEX IF NOT EXISTS idx_attempts_test_status
    ON attempts(test_id, status);

-- Identity lookup for max-attempts enforcement
CREATE INDEX IF NOT EXISTS idx_attempts_test_name
    ON attempts(test_id, student_name);

CREATE INDEX IF NOT EXISTS idx_attempts_test_identifier
    ON attempts(test_id, student_identifier)
    WHERE student_identifier IS NOT NULL;

-- RESPONSES
CREATE INDEX IF NOT EXISTS idx_responses_attempt_id
    ON responses(attempt_id);

CREATE INDEX IF NOT EXISTS idx_responses_question_id
    ON responses(question_id);

-- Fast lookup for resume (fetch all responses for an attempt)
CREATE INDEX IF NOT EXISTS idx_responses_attempt_question
    ON responses(attempt_id, question_id);

-- CHEAT_LOGS
CREATE INDEX IF NOT EXISTS idx_cheat_logs_attempt_id
    ON cheat_logs(attempt_id);

-- Count violations by type for auto-submit check
CREATE INDEX IF NOT EXISTS idx_cheat_logs_attempt_event
    ON cheat_logs(attempt_id, event_type);

