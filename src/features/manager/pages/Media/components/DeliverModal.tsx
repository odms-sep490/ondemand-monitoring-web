import type { WaitingDeliveryMission } from '../../../types/media'
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

export type DeliverModalProps = {
  mission: WaitingDeliveryMission
  onClose: () => void
  onSuccess: () => void
}

export function DeliverModal({
  mission,
  onClose,
  onSuccess,
}: DeliverModalProps) {
  const { t } = useI18n(mediaPageMessages)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await mediaApi.deliverOrder(mission.orderId, note || undefined)
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
      aria-label={t.deliverModal.ariaLabel}
    >
      <div style={{ ...DLG_STYLE, width: 640, maxWidth: 'calc(100% - 48px)' }}>
        <div style={DLG_HEAD_STYLE}>
          <div>
            <div
              style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}
            >
              {t.deliverModal.title}
            </div>
            <div
              style={{
                color: 'var(--tx3)',
                marginTop: 3,
                fontSize: 12.5,
                lineHeight: 1.45,
              }}
            >
              {mission.missionCode} · {mission.customerName} ·{' '}
              {mission.companyName}
            </div>
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-ic1 odm-btn-sm"
            onClick={onClose}
            aria-label={t.deliverModal.close}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            ...DLG_BODY_STYLE,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
            {t.deliverModal.preview(
              mission.totalFiles,
              mission.photoCount,
              mission.videoCount,
            )}
          </div>
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
              {t.deliverModal.noteForCustomer}
            </span>
            <textarea
              className="odm-inp"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.deliverModal.notePlaceholder}
            />
          </label>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--sf2)',
              border: '1px solid var(--bd)',
              fontSize: 12.5,
              lineHeight: 1.6,
            }}
          >
            {t.deliverModal.confirmInfoBefore}
            <span className="odm-mono">available_at</span>
            {t.deliverModal.confirmInfoMid(mission.totalFiles)}
            <span className="odm-mono">media_delivery</span>
            {t.deliverModal.confirmInfoEnd(mission.totalFiles)}
            <span className="odm-mono">notification</span>
            {t.deliverModal.confirmInfoTail}
          </div>
          {error && (
            <div style={{ fontSize: 11.5, color: 'var(--red-fg)' }}>
              {error}
            </div>
          )}
        </div>
        <div style={DLG_FOOT_STYLE}>
          <button type="button" className="odm-btn" onClick={onClose}>
            {t.deliverModal.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-ok"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? t.deliverModal.submitting : t.deliverModal.submit}
          </button>
        </div>
      </div>
    </div>
  )
}
