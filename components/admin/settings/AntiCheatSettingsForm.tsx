'use client'

import { Input } from '@/components/ui/Input'
import type { AntiCheatConfig } from '@/lib/types/database'

interface AntiCheatSettingsFormProps {
  config: AntiCheatConfig
  onChange: (newConfig: AntiCheatConfig) => void
}

export function AntiCheatSettingsForm({
  config,
  onChange,
}: AntiCheatSettingsFormProps) {
  const updateField = <K extends keyof AntiCheatConfig>(
    key: K,
    val: AntiCheatConfig[K]
  ) => {
    onChange({ ...config, [key]: val })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          <h3 className="text-base font-semibold text-gray-900">
            Anti-Cheat & Integrity Monitoring
          </h3>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Browser-level mechanisms to detect and prevent unauthorized actions during the exam.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tab Switch Detection */}
        <label className="flex items-start gap-3 p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/40 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={config.detect_tab_switch}
            onChange={(e) => updateField('detect_tab_switch', e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300 mt-0.5"
          />
          <div>
            <span className="text-xs font-semibold text-gray-900 block">
              Detect Tab Switching / Window Blur
            </span>
            <span className="text-xs text-gray-500 block mt-0.5">
              Logs a violation each time the student switches browser tabs or minimizes the exam window.
            </span>
          </div>
        </label>

        {/* Enforce Fullscreen */}
        <label className="flex items-start gap-3 p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/40 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={config.enforce_fullscreen}
            onChange={(e) => updateField('enforce_fullscreen', e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300 mt-0.5"
          />
          <div>
            <span className="text-xs font-semibold text-gray-900 block">
              Enforce Fullscreen Mode
            </span>
            <span className="text-xs text-gray-500 block mt-0.5">
              Requires student to enter fullscreen before viewing questions. Exiting fullscreen triggers a violation.
            </span>
          </div>
        </label>

        {/* Block Clipboard */}
        <label className="flex items-start gap-3 p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/40 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={config.block_clipboard}
            onChange={(e) => updateField('block_clipboard', e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300 mt-0.5"
          />
          <div>
            <span className="text-xs font-semibold text-gray-900 block">
              Block Clipboard & Context Menu
            </span>
            <span className="text-xs text-gray-500 block mt-0.5">
              Disables Copy, Paste, text selection, and right-click context menu within the exam interface.
            </span>
          </div>
        </label>

        {/* Allow Reconnection / Resume */}
        <label className="flex items-start gap-3 p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/40 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={config.allow_resume}
            onChange={(e) => updateField('allow_resume', e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300 mt-0.5"
          />
          <div>
            <span className="text-xs font-semibold text-gray-900 block">
              Allow Session Resume / Reconnection
            </span>
            <span className="text-xs text-gray-500 block mt-0.5">
              If student loses power or internet, allows them to reconnect with their saved answers and remaining time.
            </span>
          </div>
        </label>
      </div>

      {/* Violation Limit & Auto-Submit */}
      <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Max Allowed Violations
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={50}
              value={config.max_violations}
              onChange={(e) =>
                updateField('max_violations', Math.max(1, parseInt(e.target.value) || 3))
              }
              className="max-w-[120px]"
            />
            <span className="text-xs text-gray-400">violations allowed</span>
          </div>
        </div>

        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.auto_submit_on_limit}
              onChange={(e) => updateField('auto_submit_on_limit', e.target.checked)}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300 mt-0.5"
            />
            <div>
              <span className="text-xs font-semibold text-gray-900 block">
                Auto-Submit on Violation Limit
              </span>
              <span className="text-xs text-gray-500 block mt-0.5">
                Automatically terminates and submits the exam if the student reaches the maximum violations.
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
