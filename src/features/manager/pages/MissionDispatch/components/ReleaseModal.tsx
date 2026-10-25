import { useI18n } from '../../../../../shared/i18n'
import { missionDispatchPageMessages } from '../MissionDispatchPage.messages'
import { useState } from 'react'

export function ReleaseModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const { t } = useI18n(missionDispatchPageMessages)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    if (!reason.trim()) {
      setError(t.releaseModal.reasonRequired)
      return
    }
    onConfirm(reason)
  }

  return (
    <div className="odm-mgr-modal-overlay">
      <div
        className="odm-mgr-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="odm-mgr-release-title"
      >
        <div className="odm-mgr-modal-head">
          <div id="odm-mgr-release-title" className="odm-mgr-modal-title">
            {t.releaseModal.title}
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
            onClick={onClose}
            aria-label={t.releaseModal.close}
          >
            ×
          </button>
        </div>
        <div className="odm-mgr-modal-body">
          <label>
            <span className="odm-mgr-modal-label">
              {t.releaseModal.reasonLabel}{' '}
              <span style={{ color: 'var(--red-fg)' }}>*</span>
            </span>
            <textarea
              className="odm-inp"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError(null)
              }}
            />
            {error ? <div className="odm-mgr-modal-error">{error}</div> : null}
          </label>
        </div>
        <div className="odm-mgr-modal-footer">
          <button type="button" className="odm-btn" onClick={onClose}>
            {t.releaseModal.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-rd"
            onClick={handleConfirm}
          >
            {t.releaseModal.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
