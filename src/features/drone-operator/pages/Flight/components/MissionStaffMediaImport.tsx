import { useRef, useState } from 'react'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { missionApi } from '../../../../mission/api/missionApi'
import type { BackendMission } from '../../../api/liveMission'
import { StaffMediaImportPanel } from '../../UploadMedia/components/StaffMediaImportPanel'
import type { StaffFileSelection } from '../../../../media/capture/captureTime'
import { uploadStaffMediaBatch } from '../../../../media/upload/uploadStaffMediaBatch'

const messages = {
  vi: {
    title: 'Tải ảnh/video từ drone',
    hint: 'Bổ sung file từ thẻ nhớ vào Mission này',
    uploading: 'Đang tải tệp lên…',
    submitted: (n: number) => `${n} tệp đã được gửi để xác thực.`,
    checking: 'Đang kiểm tra quyền upload…',
    unavailable: 'Chưa thể kiểm tra quyền upload.',
    retry: 'Thử lại',
  },
  en: {
    title: 'Upload drone files',
    hint: 'Add SD card files to this Mission',
    uploading: 'Uploading files…',
    submitted: (n: number) => `${n} files submitted for validation.`,
    checking: 'Checking upload access…',
    unavailable: 'Unable to verify upload access.',
    retry: 'Try again',
  },
}

// Parent keys this component by exact Mission identity; no global active-Mission fallback.
export function MissionStaffMediaImport({
  missionId,
  missionStatus,
  onUploaded,
}: {
  missionId: string
  missionStatus: string
  onUploaded: () => void
}) {
  const { t } = useI18n(messages)
  const context = useApiQuery(
    async (signal) => {
      const [permissions, detail] = await Promise.all([
        missionApi.getPermissions(missionId),
        missionApi.getMissionById(missionId, signal),
      ])
      return {
        missionId,
        permissions,
        detail: detail as unknown as BackendMission,
      }
    },
    [missionId, missionStatus],
  )
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const data = context.data?.missionId === missionId ? context.data : undefined
  const permitted =
    !context.loading &&
    !context.error &&
    data?.permissions.canUploadMedia === true &&
    data.detail.id === missionId &&
    Boolean(data.detail.deviceId)
  async function upload(files: StaffFileSelection[]) {
    if (!permitted || !data?.detail.deviceId || submitting.current) return
    submitting.current = true
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const result = await uploadStaffMediaBatch({
        missionId,
        deviceId: data.detail.deviceId,
        files,
      })
      if (result.failures.length) setError(result.failures.join('\n'))
      if (result.submitted) setInfo(t.submitted(result.submitted))
    } finally {
      submitting.current = false
      setBusy(false)
      onUploaded()
    }
  }
  if (context.loading)
    return (
      <p className="captured-media__message" role="status">
        {t.checking}
      </p>
    )
  if (context.error)
    return (
      <p className="captured-media__message" role="alert">
        {t.unavailable}{' '}
        <button type="button" onClick={context.reload}>
          {t.retry}
        </button>
      </p>
    )
  if (!permitted) return null
  return (
    <details className="captured-media__import">
      <summary>
        <span aria-hidden="true">↑</span>
        <span>
          {t.title}
          <small>{t.hint}</small>
        </span>
        <span aria-hidden="true">＋</span>
      </summary>
      <StaffMediaImportPanel
        theme="dark"
        disabled={busy}
        flightStart={
          data?.detail.actualStartAt ?? data?.detail.scheduledStartAt
        }
        flightEnd={data?.detail.actualEndAt ?? data?.detail.scheduledEndAt}
        onUpload={upload}
      />
      {busy && (
        <p className="captured-media__import-note" role="status">
          {t.uploading}
        </p>
      )}
      {error && (
        <p className="captured-media__import-note is-error" role="alert">
          {error}
        </p>
      )}
      {info && (
        <p className="captured-media__import-note" role="status">
          {info}
        </p>
      )}
    </details>
  )
}
