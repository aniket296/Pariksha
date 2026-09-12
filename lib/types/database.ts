// =============================================================================
// Pariksha — Supabase Database Types
// =============================================================================
// This file provides TypeScript types derived from the database schema.
// These types make Supabase queries fully type-safe.
//
// To regenerate from a live Supabase project (optional):
//   npx supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/types/database.ts
// =============================================================================

// ---------------------------------------------------------------------------
// Shared JSON shapes for JSONB columns
// ---------------------------------------------------------------------------

export interface AntiCheatConfig {
  detect_tab_switch: boolean
  enforce_fullscreen: boolean
  block_clipboard: boolean
  max_violations: number
  auto_submit_on_limit: boolean
  allow_resume: boolean
}

export interface ReviewConfig {
  show_score: boolean
  show_breakdown: boolean
  show_correct_answers: boolean
  show_explanations: boolean
}

export interface WhitelistEntry {
  name: string
  identifier?: string
}

// ---------------------------------------------------------------------------
// Question content shapes (per PART 6 of spec)
// ---------------------------------------------------------------------------

export interface Choice {
  id: string
  text: string
  pinned?: boolean
}

export interface McqSingleContent {
  choices: Choice[]
}

export interface McqMultiContent {
  choices: Choice[]
}

export interface TrueFalseContent {
  choices: [
    { id: 'true'; text: 'True' },
    { id: 'false'; text: 'False' }
  ]
}

export interface FillBlankContent {
  case_sensitive: boolean
}

export interface EssayContent {
  min_words: number
  max_words: number
}

export interface LeftItem {
  id: string
  text: string
}

export interface RightItem {
  id: string
  text: string
}

export interface MatchingContent {
  left_items: LeftItem[]
  right_items: RightItem[]
}

export type QuestionContent =
  | McqSingleContent
  | McqMultiContent
  | TrueFalseContent
  | FillBlankContent
  | EssayContent
  | MatchingContent

// ---------------------------------------------------------------------------
// Question grading key shapes (SECURITY: server-only)
// ---------------------------------------------------------------------------

export interface McqSingleGradingKey {
  correct_choice_id: string
}

export interface McqMultiGradingKey {
  correct_choice_ids: string[]
}

export interface TrueFalseGradingKey {
  correct_choice_id: 'true' | 'false'
}

export interface FillBlankGradingKey {
  accepted_answers: string[]
}

export interface EssayGradingKey {
  // Empty — essay questions are manually graded
}

export interface MatchingGradingKey {
  pairs: Record<string, string>
}

export type GradingKey =
  | McqSingleGradingKey
  | McqMultiGradingKey
  | TrueFalseGradingKey
  | FillBlankGradingKey
  | EssayGradingKey
  | MatchingGradingKey

// ---------------------------------------------------------------------------
// Database row types
// ---------------------------------------------------------------------------

export type TestStatus = 'draft' | 'published' | 'archived'
export type LayoutStyle = 'single_page' | 'one_by_one'
export type AccessType = 'name_only' | 'name_and_id' | 'whitelist'
export type QuestionType =
  | 'mcq_single'
  | 'mcq_multi'
  | 'true_false'
  | 'fill_blank'
  | 'essay'
  | 'matching'
export type AttemptStatus =
  | 'in_progress'
  | 'submitted'
  | 'pending_review'
  | 'auto_submitted_violation'
  | 'timed_out'
export type CheatEventType =
  | 'tab_switch'
  | 'fullscreen_exit'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'context_menu'

// ---------------------------------------------------------------------------
// Supabase Database generic type
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      tests: {
        Row: {
          id: string
          teacher_id: string
          title: string
          description: string | null
          passcode: string | null
          status: TestStatus
          open_at: string | null
          close_at: string | null
          time_limit_mins: number
          max_attempts: number
          pass_percentage: number
          pass_message: string | null
          fail_message: string | null
          layout_style: LayoutStyle
          access_type: AccessType
          whitelist_data: WhitelistEntry[]
          anti_cheat_config: AntiCheatConfig
          review_config: ReviewConfig
          shuffle_questions: boolean
          shuffle_options: boolean
          pool_pick_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          title: string
          description?: string | null
          passcode?: string | null
          status?: TestStatus
          open_at?: string | null
          close_at?: string | null
          time_limit_mins?: number
          max_attempts?: number
          pass_percentage?: number
          pass_message?: string | null
          fail_message?: string | null
          layout_style?: LayoutStyle
          access_type?: AccessType
          whitelist_data?: WhitelistEntry[]
          anti_cheat_config?: AntiCheatConfig
          review_config?: ReviewConfig
          shuffle_questions?: boolean
          shuffle_options?: boolean
          pool_pick_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          title?: string
          description?: string | null
          passcode?: string | null
          status?: TestStatus
          open_at?: string | null
          close_at?: string | null
          time_limit_mins?: number
          max_attempts?: number
          pass_percentage?: number
          pass_message?: string | null
          fail_message?: string | null
          layout_style?: LayoutStyle
          access_type?: AccessType
          whitelist_data?: WhitelistEntry[]
          anti_cheat_config?: AntiCheatConfig
          review_config?: ReviewConfig
          shuffle_questions?: boolean
          shuffle_options?: boolean
          pool_pick_count?: number | null
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          test_id: string
          order_index: number
          type: QuestionType
          prompt: string
          points: number
          negative_points: number
          is_pinned: boolean
          content: QuestionContent
          grading_key: GradingKey
          explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          order_index?: number
          type: QuestionType
          prompt: string
          points?: number
          negative_points?: number
          is_pinned?: boolean
          content?: QuestionContent
          grading_key?: GradingKey
          explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          order_index?: number
          type?: QuestionType
          prompt?: string
          points?: number
          negative_points?: number
          is_pinned?: boolean
          content?: QuestionContent
          grading_key?: GradingKey
          explanation?: string | null
        }
      }
      attempts: {
        Row: {
          id: string
          test_id: string
          student_name: string
          student_identifier: string | null
          started_at: string
          submitted_at: string | null
          status: AttemptStatus
          score: number | null
          max_score: number
          percentage: number | null
          is_passed: boolean | null
          assigned_question_ids: string[]
          session_token: string | null
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          student_name: string
          student_identifier?: string | null
          started_at?: string
          submitted_at?: string | null
          status?: AttemptStatus
          score?: number | null
          max_score?: number
          percentage?: number | null
          is_passed?: boolean | null
          assigned_question_ids?: string[]
          session_token?: string | null
          created_at?: string
        }
        Update: {
          submitted_at?: string | null
          status?: AttemptStatus
          score?: number | null
          max_score?: number
          percentage?: number | null
          is_passed?: boolean | null
          session_token?: string | null
        }
      }
      responses: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          student_answer: unknown
          awarded_points: number | null
          is_correct: boolean | null
          teacher_comment: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          student_answer?: unknown
          awarded_points?: number | null
          is_correct?: boolean | null
          teacher_comment?: string | null
          updated_at?: string
        }
        Update: {
          student_answer?: unknown
          awarded_points?: number | null
          is_correct?: boolean | null
          teacher_comment?: string | null
          updated_at?: string
        }
      }
      cheat_logs: {
        Row: {
          id: string
          attempt_id: string
          event_type: CheatEventType
          violation_count: number
          occurred_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          event_type: CheatEventType
          violation_count?: number
          occurred_at?: string
        }
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
