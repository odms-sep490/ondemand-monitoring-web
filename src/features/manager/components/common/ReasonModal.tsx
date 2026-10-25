import { useState } from 'react'

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
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  async function handleConfirm() {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do để tiếp tục.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onConfirm(reason.trim())
      setReason('')
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.')
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
          <div style={{ color: '#dc2626', fontSize: 13, background: '#fef2f2', padding: '6px 10px', borderRadius: 6 }}>
            {error}
          </div>
        )}

        <textarea
          autoFocus
          rows={3}
          placeholder="Nhập lý do chi tiết..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={busy}
        />

        <div className="odm-reason-modal-actions">
          <button type="button" className="odm-btn" onClick={onClose} disabled={busy}>
            Hủy bỏ
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleConfirm}
            disabled={busy || !reason.trim()}
          >
            {busy ? 'Đang lưu…' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}
