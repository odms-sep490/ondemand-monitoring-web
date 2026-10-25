import type { ManualUploadTask } from '../../../types/media'
import { useI18n } from '../../../../../shared/i18n'
import { mediaPageMessages } from '../MediaPage.messages'
import { useState } from 'react'
import { mediaApi } from '../../../api/mediaApi'
import { planningError } from '../../../lib/planningErrors'
import {
  OVERLAY_STYLE,
  DLG_STYLE,
  DLG_HEAD_STYLE,
  DLG_BODY_STYLE,
  DLG_FOOT_STYLE,
} from '../mediaHelpers'

// ── sub-components ─────────────────────────────────────────────────────────

export type ReassignModalProps = {
  task: ManualUploadTask
  operators: { id: string; name: string }[]
  onClose: () => void
  onSuccess: () => void
}

export function ReassignModal({
  task,
  operators,
  onClose,
  onSuccess,
}: ReassignModalProps) {
  const { t } = useI18n(mediaPageMessages)
  const [selectedId, setSelectedId] = useState(task.assignedOperatorId)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await mediaApi.reassignTask(task.id, selectedId)
      onSuccess()
    } catch (err) {
      setError(planningError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={OVERLAY_STYLE}
      role="dialog"
      aria-modal="true"
      aria-label={t.reassignModal.ariaLabel}
    >
      <div style={{ ...DLG_STYLE, width: 460, maxWidth: 'calc(100% - 48px)' }}>
        <div style={DLG_HEAD_STYLE}>
          <div>
            <div
              style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}
            >
              {t.reassignModal.title}
            </div>
            <div
              style={{
                color: 'var(--tx3)',
                marginTop: 3,
                fontSize: 12.5,
                lineHeight: 1.45,
              }}
            >
              {t.reassignModal.subtitle}
            </div>
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-ic1 odm-btn-sm"
            onClick={onClose}
            aria-label={t.reassignModal.close}
          >
            ✕
          </button>
        </div>
        <div style={DLG_BODY_STYLE}>
          <label style={{ display: 'block' }}>
            <span
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--tx2)',
                marginBottom: 4,
              }}
            >
              {t.reassignModal.pilot}
            </span>
            <select
              className="odm-inp"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                  {op.id === task.assignedOperatorId
                    ? t.reassignModal.currentlyAssignedSuffix
                    : ''}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <div
              style={{ fontSize: 11.5, color: 'var(--red-fg)', marginTop: 4 }}
            >
              {error}
            </div>
          )}
        </div>
        <div style={DLG_FOOT_STYLE}>
          <button type="button" className="odm-btn" onClick={onClose}>
            {t.reassignModal.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? t.reassignModal.submitting : t.reassignModal.submit}
          </button>
        </div>
      </div>
    </div>
  )
}
