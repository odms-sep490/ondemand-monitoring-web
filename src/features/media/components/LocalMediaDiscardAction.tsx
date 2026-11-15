import { useRef, useState } from 'react'
import { Popconfirm } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { operatorMediaApi, type LocalMedia } from '../api/operatorMediaApi'
import { defineMessages, useI18n } from '../../../shared/i18n'

const messages = defineMessages({
  vi: {
    discard: 'Xóa tệp trên thiết bị',
    title: 'Xóa tệp trên thiết bị?',
    description:
      'Tệp trên thiết bị điều khiển sẽ bị xóa và không thể khôi phục. Media đã upload và liên kết bằng chứng trên hệ thống vẫn được giữ nguyên.',
    confirm: 'Xóa tệp',
    cancel: 'Hủy',
    failed:
      'Không thể xóa tệp. Tệp có thể đang được tải lên hoặc thiết bị mất kết nối. Hãy làm mới danh sách và thử lại.',
  },
  en: {
    discard: 'Delete local copy',
    title: 'Delete the file from the device?',
    description:
      'The file on the controller will be permanently deleted. Uploaded media and evidence links in the system will be preserved.',
    confirm: 'Delete file',
    cancel: 'Cancel',
    failed:
      'Unable to delete the file. An upload may be in progress or the device may be disconnected. Refresh the library and try again.',
  },
})

export function LocalMediaDiscardAction({
  item,
  canDiscard,
  onDiscarded,
}: {
  item: LocalMedia
  canDiscard: boolean
  onDiscarded: () => void
}) {
  const { t } = useI18n(messages)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const pending = useRef(false)
  // Match the Local Media Library's discard contract; active transfers also hold a server-side lock.
  if (
    !canDiscard ||
    item.uploadChannel === 'STAFF_FILE' ||
    item.localAvailable === false ||
    !['REVIEW_PENDING', 'UPLOAD_FAILED', 'VALIDATING'].includes(item.status)
  )
    return null

  async function discard() {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setFailed(false)
    try {
      await operatorMediaApi.discard(item.localMediaId)
      onDiscarded()
    } catch {
      setFailed(true)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <>
      <Popconfirm
        title={t.title}
        description={
          <div style={{ maxWidth: 280 }}>
            <strong style={{ overflowWrap: 'anywhere' }}>
              {item.fileName}
            </strong>
            <p>{t.description}</p>
          </div>
        }
        okText={t.confirm}
        cancelText={t.cancel}
        okButtonProps={{ danger: true, loading: busy }}
        onConfirm={discard}
      >
        <button
          type="button"
          className="media-removal-trigger media-removal-trigger--dark"
          disabled={busy}
          aria-label={`${t.discard}: ${item.fileName}`}
        >
          <DeleteOutlined aria-hidden /> {t.discard}
        </button>
      </Popconfirm>
      {failed && (
        <p role="alert" className="captured-media__discard-error">
          {t.failed}
        </p>
      )}
    </>
  )
}
