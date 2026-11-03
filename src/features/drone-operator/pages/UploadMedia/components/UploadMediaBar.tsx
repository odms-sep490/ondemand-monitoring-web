import { uploadMediaPageMessages } from '../UploadMediaPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'
import type { LocalMedia } from '../../../../media/api/operatorMediaApi'

export function UploadMediaBar({
  loadedMedia,
  totalMedia,
  pendingMedia,
  uploading,
  validating,
  manual,
  refreshWorkspace,
  canManageMedia,
  missionId,
  isBusy,
  setUploadInfo,
  approvable,
  setBatchUploading,
  approve,
}: {
  loadedMedia: number
  totalMedia: number
  pendingMedia: number
  uploading: number
  validating: number
  manual: number
  refreshWorkspace: (clearError?: boolean) => void
  canManageMedia: boolean
  missionId: string | null
  isBusy: boolean
  setUploadInfo: Dispatch<SetStateAction<string | null>>
  approvable: LocalMedia[]
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
            {validating > 0 && (
              <span className="upload-media-status is-warning">
                {t.validatingChip(validating)}
              </span>
            )}
            {manual > 0 && (
              <span className="upload-media-status is-danger">
                {t.manualChip(manual)}
              </span>
            )}
          </span>
        </div>
        {loadedMedia < totalMedia && (
          <div
            className="upload-media-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={Math.max(totalMedia, 1)}
            aria-valuenow={Math.min(loadedMedia, Math.max(totalMedia, 1))}
            aria-valuetext={t.mediaProgress(loadedMedia, totalMedia)}
            aria-label={t.mediaLoaded}
          >
            <span
              style={{
                width: totalMedia
                  ? `${Math.round((loadedMedia / totalMedia) * 100)}%`
                  : '0%',
              }}
            />
          </div>
        )}
        <small className="upload-media-bar-note">{t.summaryNote}</small>
      </div>
      <div className="upload-media-bar-actions">
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
        {canManageMedia && approvable.length > 0 ? (
          <button
            type="button"
            className="odm-btn upload-media-btn-ghost"
            disabled={!missionId || isBusy}
            onClick={() => {
              void (async () => {
                setUploadInfo(null)
                setBatchUploading(true)
                try {
                  for (const item of approvable) {
                    if (!(await approve(item))) return
                  }
                  setUploadInfo(t.batchUploadComplete)
                } finally {
                  setBatchUploading(false)
                }
              })()
            }}
          >
            {t.uploadAll}
          </button>
        ) : !canManageMedia ? (
          <span role="status" className="upload-media-viewonly">
            {t.viewOnly}
          </span>
        ) : null}
      </div>
    </div>
  )
}
