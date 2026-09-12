'use client'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { MatchingContent, MatchingGradingKey, LeftItem, RightItem } from '@/lib/types/database'

interface MatchingEditorProps {
  content: MatchingContent
  gradingKey: MatchingGradingKey
  onChange: (content: MatchingContent, gradingKey: MatchingGradingKey) => void
}

export function MatchingEditor({
  content,
  gradingKey,
  onChange,
}: MatchingEditorProps) {
  const leftItems = content.left_items || []
  const rightItems = content.right_items || []
  const pairs = gradingKey.pairs || {}

  const updateLeftItem = (id: string, text: string) => {
    const updated = leftItems.map((item) => (item.id === id ? { ...item, text } : item))
    onChange({ ...content, left_items: updated }, gradingKey)
  }

  const updateRightItem = (id: string, text: string) => {
    const updated = rightItems.map((item) => (item.id === id ? { ...item, text } : item))
    onChange({ ...content, right_items: updated }, gradingKey)
  }

  const setPairTarget = (leftId: string, targetId: string) => {
    const newPairs = { ...pairs, [leftId]: targetId }
    onChange(content, { pairs: newPairs })
  }

  const addLeftItem = () => {
    const newId = `l_${Date.now()}`
    const updated: LeftItem[] = [
      ...leftItems,
      { id: newId, text: `Premise ${leftItems.length + 1}` },
    ]
    // Default pair to the first right item if available
    const newPairs = { ...pairs }
    if (rightItems[0]) {
      newPairs[newId] = rightItems[0].id
    }
    onChange({ ...content, left_items: updated }, { pairs: newPairs })
  }

  const removeLeftItem = (id: string) => {
    if (leftItems.length <= 2) return
    const updated = leftItems.filter((i) => i.id !== id)
    const newPairs = { ...pairs }
    delete newPairs[id]
    onChange({ ...content, left_items: updated }, { pairs: newPairs })
  }

  const addRightItem = () => {
    const newId = `r_${Date.now()}`
    const updated: RightItem[] = [
      ...rightItems,
      { id: newId, text: `Target ${rightItems.length + 1}` },
    ]
    onChange({ ...content, right_items: updated }, gradingKey)
  }

  const removeRightItem = (id: string) => {
    if (rightItems.length <= 2) return
    const updated = rightItems.filter((i) => i.id !== id)
    // Update any pair pointing to this deleted right item
    const fallbackRightId = updated[0]?.id || ''
    const newPairs = { ...pairs }
    Object.keys(newPairs).forEach((leftKey) => {
      if (newPairs[leftKey] === id) {
        newPairs[leftKey] = fallbackRightId
      }
    })
    onChange({ ...content, right_items: updated }, { pairs: newPairs })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column Items */}
        <div className="space-y-3 bg-gray-50/70 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Premises (Left Column)
            </span>
            <span className="text-xs text-gray-400">{leftItems.length} items</span>
          </div>

          <div className="space-y-2">
            {leftItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono w-5">{idx + 1}.</span>
                <Input
                  value={item.text}
                  onChange={(e) => updateLeftItem(item.id, e.target.value)}
                  placeholder={`Premise ${idx + 1}`}
                  required
                />
                {leftItems.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeLeftItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    title="Remove premise"
                    aria-label={`Remove premise ${idx + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addLeftItem}
            className="w-full mt-1"
          >
            + Add Premise
          </Button>
        </div>

        {/* Right Column Items */}
        <div className="space-y-3 bg-gray-50/70 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Targets (Right Column)
            </span>
            <span className="text-xs text-gray-400">{rightItems.length} items</span>
          </div>

          <div className="space-y-2">
            {rightItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono w-5">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <Input
                  value={item.text}
                  onChange={(e) => updateRightItem(item.id, e.target.value)}
                  placeholder={`Target ${idx + 1}`}
                  required
                />
                {rightItems.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeRightItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    title="Remove target"
                    aria-label={`Remove target ${idx + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addRightItem}
            className="w-full mt-1"
          >
            + Add Target
          </Button>
        </div>
      </div>

      {/* Matching Answer Key Configuration */}
      <div className="p-3 bg-green-50/50 rounded-lg border border-green-200 space-y-3">
        <label className="block text-xs font-semibold text-green-900 uppercase tracking-wider">
          Correct Pairs Mapping
        </label>
        <p className="text-xs text-gray-500">
          Specify which Target matches each Premise:
        </p>

        <div className="space-y-2">
          {leftItems.map((lItem, idx) => (
            <div key={lItem.id} className="flex items-center gap-3 bg-white p-2 rounded border border-green-100">
              <span className="text-xs font-medium text-gray-700 min-w-[120px] truncate">
                {idx + 1}. {lItem.text || '(empty)'}
              </span>
              <span className="text-gray-400 text-xs">➔</span>
              <select
                value={pairs[lItem.id] || ''}
                onChange={(e) => setPairTarget(lItem.id, e.target.value)}
                className="flex-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {rightItems.map((rItem, rIdx) => (
                  <option key={rItem.id} value={rItem.id}>
                    {String.fromCharCode(65 + rIdx)}. {rItem.text}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
