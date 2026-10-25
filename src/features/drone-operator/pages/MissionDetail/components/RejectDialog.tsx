import { useEffect, useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { rejectDialogMessages } from './RejectDialog.messages'

export function RejectDialog({
  missionId,
  submitting,
  onCancel,
  onConfirm,
}: {
  missionId: string
  submitting: boolean
  onCancel: () => void
  onConfirm: (reason: string, notes: string) => void
}) {
  const { t } = useI18n(rejectDialogMessages)
  const [reason, setReason] = useState(t.reasons[0])
  const [notes, setNotes] = useState('')

  // Keep the selected reason valid if the language changes while the dialog
  // is open (reasons are re-translated, so re-pick the first one by default).
  useEffect(() => {
    if (!t.reasons.includes(reason)) setReason(t.reasons[0])
  }, [t.reasons])

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 20, 25, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        className="odm-card"
        style={{ width: 440, maxWidth: '92vw', padding: 0 }}
      >
        <div className="odm-card-body" style={{ padding: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {t.title(missionId)}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--tx2)' }}>
            {t.description}
          </p>
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {t.reasons.map((r) => (
              <label
                key={r}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="reject-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                />
                {r}
              </label>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <label
              htmlFor="reject-notes"
              style={{
                fontSize: 12.5,
                color: 'var(--tx3)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              {t.notesLabel}
            </label>
            <textarea
              id="reject-notes"
              className="odm-input"
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 18,
            }}
          >
            <button
              type="button"
              className="odm-btn"
              onClick={onCancel}
              disabled={submitting}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-rd"
              onClick={() => onConfirm(reason, notes)}
              disabled={submitting}
            >
              {submitting ? t.submitting : t.submit}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
