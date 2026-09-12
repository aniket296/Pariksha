'use client'

import { Input } from '@/components/ui/Input'
import type { EssayContent, EssayGradingKey } from '@/lib/types/database'

interface EssayEditorProps {
  content: EssayContent
  gradingKey: EssayGradingKey
  onChange: (content: EssayContent, gradingKey: EssayGradingKey) => void
}

export function EssayEditor({
  content,
  gradingKey,
  onChange,
}: EssayEditorProps) {
  const updateMinWords = (val: number) => {
    onChange({ ...content, min_words: Math.max(0, val) }, gradingKey)
  }

  const updateMaxWords = (val: number) => {
    onChange({ ...content, max_words: Math.max(0, val) }, gradingKey)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
        <p className="font-semibold mb-1">📝 Manual Teacher Grading</p>
        <p>
          Essay questions are not graded automatically upon submission. After the student submits,
          the test attempt will be marked as <code className="font-mono bg-blue-100 px-1 rounded">pending_review</code> until
          you review and award points.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Minimum Words
          </label>
          <Input
            type="number"
            min={0}
            value={content.min_words}
            onChange={(e) => updateMinWords(parseInt(e.target.value) || 0)}
            placeholder="0 for no minimum"
          />
          <span className="text-xs text-gray-400 mt-0.5 block">0 = no minimum required</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Maximum Words
          </label>
          <Input
            type="number"
            min={0}
            value={content.max_words}
            onChange={(e) => updateMaxWords(parseInt(e.target.value) || 0)}
            placeholder="e.g. 500"
          />
          <span className="text-xs text-gray-400 mt-0.5 block">0 = unlimited</span>
        </div>
      </div>
    </div>
  )
}
