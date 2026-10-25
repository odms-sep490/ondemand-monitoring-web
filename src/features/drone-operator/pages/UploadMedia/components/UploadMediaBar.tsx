import { uploadMediaPageMessages } from '../UploadMediaPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'
import type { LocalMedia } from '../../../../media/api/operatorMediaApi'

export function UploadMediaBar({
  loadedMedia,
  totalMedia,
  pendingMedia,
  uploading,
  manual,
  backRoute,
  refreshWorkspace,
  canManageMedia,
  missionId,
  isBusy,
  setUploadInfo,
  approvable,
  refresh,
  referenceCount,
  setBatchUploading,
  approve,
}: {
  loadedMedia: number
  totalMedia: number
  pendingMedia: number
  uploading: number
  manual: number
  backRoute: string
  refreshWorkspace: (clearError?: boolean) => void
  canManageMedia: boolean
  missionId: string | null
  isBusy: boolean
  setUploadInfo: Dispatch<SetStateAction<string | null>>
  approvable: LocalMedia[]
  refresh: (
    options?: { background?: boolean | undefined } | undefined,
  ) => Promise<void>
  referenceCount: number
  setBatchUploading: Dispatch<SetStateAction<boolean>>
  approve: (item: LocalMedia, manual?: boolean) => Promise<boolean>
}) {
  const { t } = useI18n(uploadMediaPageMessages)
  return (
    <div className="upload-media-bar">
      <div className="upload-media-bar-main">
        <div className="upload-media-bar-head">
          <strong className="upload-media-bar-count">
            {loadedMedia} / {totalMedia}
          </strong>
          <span>{t.mediaLoaded}</span>
          <span className="upload-media-chips">
            {loadedMedia > 0 && (
              <span className="upload-media-status is-success">
                {t.uploadedChip(loadedMedia)}
              </span>
            )}
            {pendingMedia > 0 && (
              <span className="upload-media-status is-warning">
                {t.pendingChip(pendingMedia)}
              </span>
            )}
            {uploading > 0 && (
              <span className="upload-media-status is-info">
                {t.uploadingChip(uploading)}
              </span>
            )}
            {manual > 0 && (
              <span className="upload-media-status is-danger">
                {t.manualChip(manual)}
              </span>
            )}
          </span>
        </div>
        <div
          className="upload-media-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalMedia}
          aria-valuenow={loadedMedia}
          aria-label={t.summary(loadedMedia, totalMedia, uploading, manual)}
        >
          <span
            style={{
              width: totalMedia
                ? `${Math.round((loadedMedia / totalMedia) * 100)}%`
                : '0%',
            }}
          />
        </div>
        <small className="upload-media-bar-note">{t.summaryNote}</small>
      </div>
      <div className="upload-media-bar-actions">
        <a className="odm-btn upload-media-btn-ghost" href={backRoute}>
          <span aria-hidden="true">←</span>
          {t.backToCockpit}
        </a>
        <button
          type="button"
          className="odm-btn upload-media-btn-ghost"
          onClick={() => {
            refreshWorkspace()
          }}
        >
          <span aria-hidden="true">↻</span>
          {t.refresh}
        </button>
        {canManageMedia ? (
          <button
            type="button"
            className="odm-btn upload-media-btn-ghost"
            disabled={!missionId || isBusy}
            onClick={() => {
              void (async () => {
                setUploadInfo(null)
                if (approvable.length === 0) {
                  await refresh()
                  setUploadInfo(
                    referenceCount > 0
                      ? `Tất cả media đã được lưu (${referenceCount} ảnh tham chiếu). Không còn file nào chờ upload.`
                      : 'Không có file nào chờ upload.',
                  )
                  return
                }
                setBatchUploading(true)
                try {
                  for (const item of approvable) {
                    if (!(await approve(item))) return
                  }
                  setUploadInfo(
                    'Đã gửi các file đang chờ. Trạng thái lưu/xác thực được cập nhật từ backend.',
                  )
                } finally {
                  setBatchUploading(false)
                }
              })()
            }}
          >
            {t.uploadAll}
          </button>
        ) : (
          <span role="status" className="upload-media-viewonly">
            {t.viewOnly}
          </span>
        )}
      </div>
    </div>
  )
}
