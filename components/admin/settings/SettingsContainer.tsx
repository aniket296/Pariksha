'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AccessSettingsForm } from './AccessSettingsForm'
import { ScheduleSettingsForm } from './ScheduleSettingsForm'
import { TimingPresentationForm } from './TimingPresentationForm'
import { GradingCriteriaForm } from './GradingCriteriaForm'
import { AntiCheatSettingsForm } from './AntiCheatSettingsForm'
import { ReviewSettingsForm } from './ReviewSettingsForm'
import {
  updateTestSettingsAction,
  type UpdateTestSettingsPayload,
} from '@/lib/actions/test-settings'
import type { Database } from '@/lib/types/database'

type TestRow = Database['public']['Tables']['tests']['Row']

interface SettingsContainerProps {
  test: TestRow
}

export function SettingsContainer({ test }: SettingsContainerProps) {
  const [formData, setFormData] = useState<UpdateTestSettingsPayload>({
    access_type: test.access_type,
    passcode: test.passcode,
    max_attempts: test.max_attempts,
    whitelist_data: test.whitelist_data || [],
    open_at: test.open_at,
    close_at: test.close_at,
    time_limit_mins: test.time_limit_mins,
    layout_style: test.layout_style,
    pass_percentage: test.pass_percentage,
    pass_message: test.pass_message,
    fail_message: test.fail_message,
    anti_cheat_config: test.anti_cheat_config,
    review_config: test.review_config,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setFeedback(null)

    try {
      const res = await updateTestSettingsAction(test.id, formData)
      if (res.error) {
        setFeedback({ type: 'error', text: res.error })
      } else {
        setFeedback({ type: 'success', text: res.message || 'Settings saved successfully.' })
        setTimeout(() => setFeedback(null), 3500)
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save settings',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Save Alert */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Access & Passcode */}
      <AccessSettingsForm
        accessType={formData.access_type}
        passcode={formData.passcode}
        maxAttempts={formData.max_attempts}
        whitelistData={formData.whitelist_data}
        onChange={(fields) => setFormData((prev) => ({ ...prev, ...fields }))}
      />

      {/* Schedule Window */}
      <ScheduleSettingsForm
        openAt={formData.open_at}
        closeAt={formData.close_at}
        onChange={(fields) => setFormData((prev) => ({ ...prev, ...fields }))}
      />

      {/* Timing & Layout */}
      <TimingPresentationForm
        timeLimitMins={formData.time_limit_mins}
        layoutStyle={formData.layout_style}
        onChange={(fields) => setFormData((prev) => ({ ...prev, ...fields }))}
      />

      {/* Anti-Cheat Configuration */}
      <AntiCheatSettingsForm
        config={formData.anti_cheat_config}
        onChange={(config) => setFormData((prev) => ({ ...prev, anti_cheat_config: config }))}
      />

      {/* Grading & Pass Threshold */}
      <GradingCriteriaForm
        passPercentage={formData.pass_percentage}
        passMessage={formData.pass_message}
        failMessage={formData.fail_message}
        onChange={(fields) => setFormData((prev) => ({ ...prev, ...fields }))}
      />

      {/* Review & Results Disclosure */}
      <ReviewSettingsForm
        config={formData.review_config}
        onChange={(config) => setFormData((prev) => ({ ...prev, review_config: config }))}
      />

      {/* Sticky Bottom Save Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 p-4 shadow-lg flex items-center justify-between gap-4 max-w-4xl mx-auto">
        <div className="text-xs text-gray-500">
          Make sure to click &quot;Save Settings&quot; to apply your changes.
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={isSaving}
            onClick={handleSave}
            className="px-6"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}

