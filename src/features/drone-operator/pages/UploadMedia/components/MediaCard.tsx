import { MediaChecklistAttachment } from './MediaChecklistAttachment'
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
  selectedTargets,
  setSelectedTargets,
  attachFailures,
  uploadPc,
  attachTargets,
  detachTarget,
  automaticAttach = false,
  remotePreviewUrl,
  reviewMedia,
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
  selectedTargets: Record<string, string[]>
  setSelectedTargets: Dispatch<SetStateAction<Record<string, string[]>>>
  attachFailures: Record<string, string>
  uploadPc: (item: LocalMedia, file: File) => Promise<void>
  attachTargets?: (item: LocalMedia, ids: string[]) => Promise<void>
  detachTarget?: (executionId: string, mediaId: string) => Promise<void>
  automaticAttach?: boolean
  remotePreviewUrl?: string
  reviewMedia?: (mediaId: string) => Promise<void>
}) {
  const { t } = useI18n(uploadMediaPageMessages)
  return (
    <article className="upload-media-card">
      <div className="upload-media-thumb">
        {item.localAvailable === false && !remotePreviewUrl ? (
          <p className="upload-media-unavailable">
            Bản gốc trên Flight Controller không khả dụng. Chọn bản sao PC để
            khôi phục.
          </p>
        ) : item.mediaType === 'IMAGE' ? (
          <img
            src={
              remotePreviewUrl ?? operatorMediaApi.previewUrl(item.localMediaId)
            }
            alt={item.fileName}
            className="upload-media-preview"
          />
        ) : (
          <video
            src={
              remotePreviewUrl ?? operatorMediaApi.previewUrl(item.localMediaId)
            }
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
          {reviewMedia &&
            item.backendMediaId &&
            status === 'PENDING_MANAGER_APPROVAL' && (
              <button
                type="button"
                className="odm-btn odm-btn-p"
                disabled={isBusy}
                onClick={() => void reviewMedia(item.backendMediaId!)}
              >
                {t.approveEvidence}
              </button>
            )}
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
          {canManageMedia &&
            (!automaticAttach ||
              ['UPLOAD_FAILED', 'RETRY_REQUIRED'].includes(status)) && (
              <button
                type="button"
                className="odm-btn odm-btn-p"
                disabled={
                  isBusy || !canApprove || item.localAvailable === false
                }
                onClick={() => void approve(item)}
              >
                {busyId === item.localMediaId ? t.processing : t.approveUpload}
              </button>
            )}
          {item.mediaType === 'IMAGE' &&
            (item.localAvailable !== false || remotePreviewUrl) && (
              <button
                type="button"
                className="odm-btn"
                onClick={() =>
                  remotePreviewUrl
                    ? window.open(
                        remotePreviewUrl,
                        '_blank',
                        'noopener,noreferrer',
                      )
                    : setPreview(item)
                }
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
          !monitoring.error && (
            <MediaChecklistAttachment
              fileName={item.fileName}
              mediaId={item.backendMediaId}
              mediaType={item.mediaType}
              executions={monitoring.data.checklist.executions}
              selectedIds={selectedTargets[item.localMediaId] ?? []}
              disabled={isBusy || monitoring.loading}
              autoUpload={automaticAttach}
              onDetach={
                detachTarget && item.backendMediaId
                  ? (executionId) =>
                      detachTarget(executionId, item.backendMediaId!)
                  : undefined
              }
              onSave={async (ids) => {
                setSelectedTargets((previous) => ({
                  ...previous,
                  [item.localMediaId]: ids,
                }))
                if (attachTargets) {
                  await attachTargets(item, ids)
                }
                return true
              }}
            />
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
