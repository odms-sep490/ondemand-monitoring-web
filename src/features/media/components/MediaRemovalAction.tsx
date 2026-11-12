import { useRef, useState } from 'react'
import { Modal } from '../../../shared/components/ui'
import { ApiError } from '../../../shared/api/httpClient'
import { useI18n } from '../../../shared/i18n'
import { operatorMediaApi, type LocalMedia } from '../api/operatorMediaApi'
import './MediaRemovalAction.css'

const messages = {
  vi: {
    remove: 'Gỡ media',
    title: 'Gỡ media upload nhầm?',
    reason: 'Lý do gỡ',
    cancel: 'Hủy',
    confirm: 'Xác nhận gỡ',
    busy: 'Đang gỡ…',
    warning:
      'Media sẽ được gỡ khỏi thư viện Mission. Lịch sử được giữ lại; file lưu trữ sẽ được dọn sau. Thao tác này không thể hoàn tác tại đây.',
    protected:
      'Chưa thể gỡ media này. Media đang gắn checklist hoặc nằm trong kết quả/bàn giao được bảo vệ. Hãy gỡ liên kết nếu được phép trước.',
    stale:
      'Media đã thay đổi. Hãy đóng cửa sổ, làm mới thư viện và kiểm tra lại trước khi gỡ.',
    denied: 'Bạn không có quyền gỡ media của Mission này.',
    missing: 'Media không còn khả dụng. Hãy làm mới thư viện.',
    failed: 'Không thể gỡ media. Kiểm tra kết nối rồi thử lại.',
  },
  en: {
    remove: 'Remove media',
    title: 'Remove this uploaded file?',
    reason: 'Removal reason',
    cancel: 'Cancel',
    confirm: 'Confirm removal',
    busy: 'Removing…',
    warning:
      'This media will be removed from the Mission library. History is retained and storage is cleaned up later. You cannot undo this here.',
    protected:
      'This media is protected by checklist, result or delivery references. Detach it first where permitted.',
    stale:
      'Media has changed. Close this dialog, refresh the library and review it again before removing.',
    denied: 'You cannot remove media from this Mission.',
    missing: 'This media is no longer available. Refresh the library.',
    failed: 'Unable to remove media. Check your connection and try again.',
  },
}

export function MediaRemovalAction({
  item,
  canRemove,
  disabled = false,
  onRemoved,
  theme = 'light',
}: {
  item: LocalMedia
  canRemove: boolean
  disabled?: boolean
  onRemoved: (mediaId: string) => void
  theme?: 'light' | 'dark'
}) {
  const { t } = useI18n(messages)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [version, setVersion] = useState<number | undefined>()
  const [busy, setBusy] = useState(false)
  const [stale, setStale] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)
  if (
    !canRemove ||
    !item.staffCreated ||
    !item.backendMediaId ||
    typeof item.version !== 'number' ||
    item.status === 'REMOVED'
  )
    return null
  const close = () => {
    if (!submitting.current) setOpen(false)
  }
  async function submit() {
    if (
      submitting.current ||
      stale ||
      version === undefined ||
      !reason.trim() ||
      !item.backendMediaId
    )
      return
    submitting.current = true
    setBusy(true)
    setError(null)
    try {
      const response = await operatorMediaApi.removeStaffMedia(
        item.missionId,
        item.backendMediaId,
        version,
        reason.trim(),
      )
      if (!response.removed || response.mediaId !== item.backendMediaId) throw new Error('Removal was not confirmed')
      setOpen(false)
      onRemoved(item.backendMediaId)
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : undefined
      setStale(code === 'CONCURRENT_UPDATE')
      setError(
        code === 'CONCURRENT_UPDATE'
          ? t.stale
          : code === 'MEDIA_EVIDENCE_PROTECTED'
            ? t.protected
            : code === 'ACCESS_DENIED' || code === 'UNAUTHORIZED'
              ? t.denied
              : code === 'MEDIA_NOT_FOUND'
                ? t.missing
                : t.failed,
      )
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }
  return (
    <>
      <button
        type="button"
        className={`media-removal-trigger media-removal-trigger--${theme}`}
        aria-label={`${t.remove}: ${item.fileName}`}
        disabled={disabled}
        onClick={() => {
          setReason('')
          setError(null)
          setStale(false)
          setVersion(item.version)
          setOpen(true)
        }}
      >
        {t.remove}
      </button>
      {open && (
        <Modal
          title={t.title}
          subtitle={item.fileName}
          tone="danger"
          onClose={close}
          footer={
            <>
              <button
                type="button"
                className="odm-btn media-removal-cancel"
                disabled={busy}
                onClick={close}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="media-removal-confirm"
                disabled={disabled || busy || stale || !reason.trim()}
                onClick={() => void submit()}
              >
                {busy ? t.busy : t.confirm}
              </button>
            </>
          }
        >
          <div className="media-removal-form">
            <p>{t.warning}</p>
            <label>
              {t.reason}
              <textarea
                value={reason}
                maxLength={500}
                rows={3}
                disabled={busy}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <small>{reason.length}/500</small>
            {error && <p role="alert">{error}</p>}
          </div>
        </Modal>
      )}
    </>
  )
}
