import type { BadMediaItem } from '../../../types/media'
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

export type ReuploadModalProps = {
  media: BadMediaItem
  onClose: () => void
  onSuccess: () => void
}

export function ReuploadModal({
  media: _media,
  onClose,
  onSuccess,
}: ReuploadModalProps) {
  const { t } = useI18n(mediaPageMessages)
  const [reason, setReason] = useState(t.reuploadModal.defaultReason)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await mediaApi.requestReupload(_media.id, reason)
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
      aria-label={t.reuploadModal.ariaLabel}
    >
      <div style={{ ...DLG_STYLE, width: 460, maxWidth: 'calc(100% - 48px)' }}>
        <div style={DLG_HEAD_STYLE}>
          <div>
            <div
              style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}
            >
              {t.reuploadModal.title}
            </div>
            <div
              style={{
                color: 'var(--tx3)',
                marginTop: 3,
                fontSize: 12.5,
                lineHeight: 1.45,
              }}
            >
              {t.reuploadModal.subtitle}
            </div>
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-ic1 odm-btn-sm"
            onClick={onClose}
            aria-label={t.reuploadModal.close}
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
              {t.reuploadModal.noteForPilot}
            </span>
            <textarea
              className="odm-inp"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
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
            {t.reuploadModal.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
          >
            {submitting ? t.reuploadModal.submitting : t.reuploadModal.submit}
          </button>
        </div>
      </div>
    </div>
  )
}
