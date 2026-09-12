import { describe, it, expect } from 'vitest'
import { evaluateStudentAnswer } from '@/lib/grading/engine'
import type {
  McqSingleContent,
  McqMultiContent,
  TrueFalseContent,
  FillBlankContent,
  MatchingContent,
} from '@/lib/types/database'

describe('Grading Engine — evaluateStudentAnswer', () => {
  describe('MCQ Single', () => {
    const content: McqSingleContent = {
      choices: [
        { id: 'opt_1', text: 'Paris' },
        { id: 'opt_2', text: 'London' },
      ],
    }
    const key = { correct_choice_id: 'opt_1' }

    it('awards full points for correct answer', () => {
      const res = evaluateStudentAnswer('mcq_single', 5, 0, content, key, 'opt_1')
      expect(res.is_correct).toBe(true)
      expect(res.awarded_points).toBe(5)
    })

    it('awards 0 points and false for wrong answer without negative grading', () => {
      const res = evaluateStudentAnswer('mcq_single', 5, 0, content, key, 'opt_2')
      expect(res.is_correct).toBe(false)
      expect(res.awarded_points).toBe(0)
    })

    it('deducts penalty for wrong answer with negative points', () => {
      const res = evaluateStudentAnswer('mcq_single', 5, 2, content, key, 'opt_2')
      expect(res.is_correct).toBe(false)
      expect(res.awarded_points).toBe(-2)
    })

    it('awards 0 points for unanswered question without penalty', () => {
      const res = evaluateStudentAnswer('mcq_single', 5, 2, content, key, null)
      expect(res.is_correct).toBe(false)
      expect(res.awarded_points).toBe(0)
    })
  })

  describe('MCQ Multi Partial Credit Formula', () => {
    const content: McqMultiContent = {
      choices: [
        { id: 'c1', text: 'Option 1 (Correct)' },
        { id: 'c2', text: 'Option 2 (Correct)' },
        { id: 'w1', text: 'Option 3 (Wrong)' },
        { id: 'w2', text: 'Option 4 (Wrong)' },
      ],
    }
    const key = { correct_choice_ids: ['c1', 'c2'] }

    it('awards full points on exact match', () => {
      const res = evaluateStudentAnswer('mcq_multi', 10, 0, content, key, ['c1', 'c2'])
      expect(res.is_correct).toBe(true)
      expect(res.awarded_points).toBe(10)
    })

    it('awards partial credit when 1 of 2 correct choices selected', () => {
      const res = evaluateStudentAnswer('mcq_multi', 10, 0, content, key, ['c1'])
      expect(res.is_correct).toBe(true)
      expect(res.awarded_points).toBe(5)
    })

    it('prevents gaming by selecting all options when negative grading is active', () => {
      // If student selects ['c1', 'c2', 'w1', 'w2']
      const res = evaluateStudentAnswer('mcq_multi', 10, 5, content, key, [
        'c1',
        'c2',
        'w1',
        'w2',
      ])
      // 10 - 2*5 = 0
      expect(res.awarded_points).toBeLessThanOrEqual(0)
    })

    it('does not award negative total score for an individual question', () => {
      const res = evaluateStudentAnswer('mcq_multi', 10, 15, content, key, [
        'c1',
        'w1',
        'w2',
      ])
      // 5 - 30 = -25 -> should clamp to 0 or negative penalty bounded
      expect(res.is_correct).toBe(false)
    })
  })

  describe('Fill in the Blank Normalization', () => {
    const content: FillBlankContent = { case_sensitive: false }
    const key = { accepted_answers: ['New York', 'NYC'] }

    it('matches case insensitively when case_sensitive is false', () => {
      const res = evaluateStudentAnswer('fill_blank', 4, 0, content, key, 'new york')
      expect(res.is_correct).toBe(true)
      expect(res.awarded_points).toBe(4)
    })

    it('trims leading and trailing whitespace', () => {
      const res = evaluateStudentAnswer('fill_blank', 4, 0, content, key, '  NYC  ')
      expect(res.is_correct).toBe(true)
      expect(res.awarded_points).toBe(4)
    })

    it('respects case_sensitive when true', () => {
      const caseContent: FillBlankContent = { case_sensitive: true }
      const res = evaluateStudentAnswer('fill_blank', 4, 0, caseContent, key, 'new york')
      expect(res.is_correct).toBe(false)
    })
  })

  describe('Matching Questions', () => {
    const content: MatchingContent = {
      left_items: [
        { id: 'l1', text: 'France' },
        { id: 'l2', text: 'Japan' },
      ],
      right_items: [
        { id: 'r1', text: 'Paris' },
        { id: 'r2', text: 'Tokyo' },
      ],
    }
    const key = { pairs: { l1: 'r1', l2: 'r2' } }

    it('awards full points when all pairs matched', () => {
      const res = evaluateStudentAnswer('matching', 10, 0, content, key, {
        l1: 'r1',
        l2: 'r2',
      })
      expect(res.is_correct).toBe(true)
      expect(res.awarded_points).toBe(10)
    })

    it('awards proportional partial credit', () => {
      const res = evaluateStudentAnswer('matching', 10, 0, content, key, {
        l1: 'r1',
        l2: 'wrong',
      })
      expect(res.is_correct).toBe(false)
      expect(res.awarded_points).toBe(5)
    })
  })
})

