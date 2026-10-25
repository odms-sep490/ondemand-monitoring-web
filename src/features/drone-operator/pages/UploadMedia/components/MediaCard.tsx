import { operatorMediaApi } from '../../../../media/api/operatorMediaApi'
import {
  mediaTypeLabel,
  mediaSourceLabel,
  statusTone,
  mediaStatusLabel,
  finishedUploadStatuses,
} from '../uploadMediaHelpers'
import { PcBackupPicker } from '../../../../media/components/PcBackupPicker'
import { uploadMediaPageMessages } from '../UploadMediaPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { LocalMedia } from '../../../../media/api/operatorMediaApi'
import type { Dispatch, SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { MissionChecklistResponse } from '../../../../mission/types/checklistExecution'
import type { MissionResult } from '../../../../mission/types/mission'
import type { MissionPermissions } from '../../../../mission/types/permissions'

export function MediaCard({
  item,
  setPreview,
  status,
  canManageMedia,
  isBusy,
  approve,
  canApprove,
  busyId,
  canDiscard,
  discard,
  monitoring,
  targetCount,
  selectedTargets,
  setSelectedTargets,
  setBusyId,
  attachSelected,
  attachFailures,
  uploadPc,
}: {
  item: LocalMedia
  setPreview: Dispatch<SetStateAction<LocalMedia | null>>
  status: string
  canManageMedia: boolean
  isBusy: boolean
  approve: (item: LocalMedia, manual?: boolean) => Promise<boolean>
  canApprove: boolean
  busyId: string | null
  canDiscard: boolean
  discard: (item: LocalMedia) => Promise<void>
  monitoring: UseApiQueryState<{
    checklist: MissionChecklistResponse
    result: MissionResult | null
    permissions: MissionPermissions
  }>
  targetCount: number
  selectedTargets: Record<string, string[]>
  setSelectedTargets: Dispatch<SetStateAction<Record<string, string[]>>>
  setBusyId: Dispatch<SetStateAction<string | null>>
  attachSelected: (item: LocalMedia, mediaId: string) => Promise<void>
  attachFailures: Record<string, string>
  uploadPc: (item: LocalMedia, file: File) => Promise<void>
}) {
  const { t } = useI18n(uploadMediaPageMessages)
  return (
    <article className="upload-media-card">
      <div className="upload-media-thumb">
        {item.localAvailable === false ? (
          <p className="upload-media-unavailable">
            Bản gốc trên Flight Controller không khả dụng. Chọn bản sao PC để
            khôi phục.
          </p>
        ) : item.mediaType === 'IMAGE' ? (
          <img
            src={operatorMediaApi.previewUrl(item.localMediaId)}
            alt={item.fileName}
            className="upload-media-preview"
          />
        ) : (
          <video
            src={operatorMediaApi.previewUrl(item.localMediaId)}
            controls
            preload="metadata"
            className="upload-media-preview"
          />
        )}
        {item.mediaType === 'IMAGE' && item.localAvailable !== false && (
          <button
            type="button"
            className="upload-media-expand"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setPreview(item)}
          >
            ⛶
          </button>
        )}
      </div>
      <div className="upload-media-card-body">
        <div className="odm-mono upload-media-filename" title={item.fileName}>
          {item.fileName}
        </div>
        <div className="upload-media-meta">
          <span>{mediaTypeLabel[item.mediaType] ?? item.mediaType}</span>
          <span aria-hidden="true">•</span>
          <span>{(item.fileSize / 1_000_000).toFixed(2)} MB</span>
          {item.sourceType && (
            <>
              <span aria-hidden="true">•</span>
              <span>
                {mediaSourceLabel[item.sourceType] ?? item.sourceType}
              </span>
            </>
          )}
        </div>
        <span className={`upload-media-status ${statusTone(status)}`}>
          {mediaStatusLabel[status] ?? status}
        </span>
        {item.previewError && (
          <p role="alert" className="upload-media-notice is-danger">
            {item.previewError}
          </p>
        )}
        <div className="upload-media-actions">
          {canManageMedia && status === 'MANUAL_UPLOAD_REQUIRED' && (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={isBusy || item.localAvailable === false}
              onClick={() => void approve(item, true)}
            >
              Upload thủ công từ bản gốc
            </button>
          )}
          {canManageMedia && (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={isBusy || !canApprove || item.localAvailable === false}
              onClick={() => void approve(item)}
            >
              {busyId === item.localMediaId ? t.processing : t.approveUpload}
            </button>
          )}
          {item.mediaType === 'IMAGE' && item.localAvailable !== false && (
            <button
              type="button"
              className="odm-btn"
              onClick={() => setPreview(item)}
            >
              <span aria-hidden="true">{t.viewShort}</span>
              <span className="upload-media-sr">{t.enlargePreview}</span>
            </button>
          )}
          {canManageMedia && (
            <details className="upload-media-more">
              <summary aria-label={t.moreActions} title={t.moreActions}>
                ⋮
              </summary>
              <div className="upload-media-menu">
                <button
                  type="button"
                  className="odm-btn"
                  disabled={isBusy || !canDiscard}
                  onClick={() => void discard(item)}
                >
                  {finishedUploadStatuses.has(status)
                    ? t.deleteLocal
                    : t.discard}
                </button>
              </div>
            </details>
          )}
        </div>
        {monitoring.data?.permissions.canAttachChecklistEvidence === true &&
          !monitoring.loading &&
          !monitoring.error && (
            <details
              className="upload-media-attach-wrap"
              open={targetCount > 0}
            >
              <summary>
                {t.attachToChecklist}
                {targetCount > 0 && (
                  <span className="upload-media-chip">
                    {t.attachSelected(targetCount)}
                  </span>
                )}
              </summary>
              <fieldset disabled={isBusy} className="upload-media-attach">
                {monitoring.data.checklist.executions.map((execution) => (
                  <label key={execution.id} className="upload-media-attach-row">
                    <input
                      type="checkbox"
                      checked={(
                        selectedTargets[item.localMediaId] ?? []
                      ).includes(execution.id)}
                      onChange={(event) =>
                        setSelectedTargets((previous) => {
                          const current = previous[item.localMediaId] ?? []
                          return {
                            ...previous,
                            [item.localMediaId]: event.target.checked
                              ? [...current, execution.id]
                              : current.filter((id) => id !== execution.id),
                          }
                        })
                      }
                    />
                    <span>{execution.content}</span>
                    <em>
                      {execution.eligibleEvidenceCount ?? 0}/
                      {execution.minimumEvidenceCount ?? 0}
                    </em>
                  </label>
                ))}
                {item.backendMediaId && (
                  <button
                    type="button"
                    className="odm-btn upload-media-attach-button"
                    disabled={isBusy || !targetCount}
                    onClick={() => {
                      const mediaId = item.backendMediaId
                      if (!mediaId) return
                      setBusyId(item.localMediaId)
                      void attachSelected(item, mediaId).finally(() =>
                        setBusyId(null),
                      )
                    }}
                  >
                    Gắn bằng chứng — không upload lại
                  </button>
                )}
              </fieldset>
            </details>
          )}
        {attachFailures[item.localMediaId] && (
          <p role="alert" className="upload-media-notice is-danger">
            Media đã được giữ. Gắn bằng chứng chưa thành công:{' '}
            {attachFailures[item.localMediaId]}. Chọn “Gắn bằng chứng” để thử
            lại, không upload lại.
          </p>
        )}
        {canManageMedia &&
          item.manualTaskId &&
          ['MANUAL_UPLOAD_REQUIRED', 'UPLOAD_PENDING'].includes(status) && (
            <PcBackupPicker
              contentType={item.contentType}
              disabled={isBusy}
              onSelect={(file) => void uploadPc(item, file)}
            />
          )}
      </div>
    </article>
  )
}
