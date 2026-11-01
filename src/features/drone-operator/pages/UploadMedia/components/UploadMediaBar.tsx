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
  validating: number
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
                  setUploadInfo(t.noPendingUploads(referenceCount))
                  return
                }
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
        ) : (
          <span role="status" className="upload-media-viewonly">
            {t.viewOnly}
          </span>
        )}
      </div>
    </div>
  )
}
