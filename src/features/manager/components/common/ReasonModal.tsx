import { useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { reasonModalMessages } from './ReasonModal.messages'
import './MissionGridCard.css'

interface ReasonModalProps {
  isOpen: boolean
  title: string
  hint: string
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}

export function ReasonModal({
  isOpen,
  title,
  hint,
  onClose,
  onConfirm,
}: ReasonModalProps) {
  const { t } = useI18n(reasonModalMessages)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  async function handleConfirm() {
    if (!reason.trim()) {
      setError(t.required)
      return
    }
    setBusy(true)
    setError('')
    try {
      await onConfirm(reason.trim())
      setReason('')
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="odm-reason-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="odm-reason-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{hint}</p>

        {error && (
          <div className="odm-mcard-error" role="alert">
            {error}
          </div>
        )}

        <textarea
          autoFocus
          rows={3}
          placeholder={t.placeholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={busy}
        />

        <div className="odm-reason-modal-actions">
          <button type="button" className="odm-btn" onClick={onClose} disabled={busy}>
            {t.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleConfirm}
            disabled={busy || !reason.trim()}
          >
            {busy ? t.saving : t.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
