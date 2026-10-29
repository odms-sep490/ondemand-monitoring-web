import { EllipsisOutlined, ExpandOutlined } from '@ant-design/icons'
import { Alert, Button, Checkbox, Dropdown } from 'antd'

import { StatusTag } from '../../../../../shared/components/antd'
import { operatorMediaApi } from '../../../../media/api/operatorMediaApi'
import { finishedUploadStatuses } from '../uploadMediaHelpers'
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
  const statusKind = /FAIL|REJECT|ERROR|MANUAL_UPLOAD_REQUIRED/.test(status)
    ? 'danger'
    : /PENDING|VALIDATING|UPLOADING|REVIEW/.test(status)
      ? 'warning'
      : /AVAILABLE|UPLOADED|VALIDATED|STORED|COMPLETED|READY/.test(status)
        ? 'success'
        : 'neutral'
  return (
    <article className="stf-media-card">
      <div className="stf-media-thumb">
        {item.localAvailable === false ? (
          <p className="stf-media-unavailable">{t.originalUnavailable}</p>
        ) : item.mediaType === 'IMAGE' ? (
          <img
            src={operatorMediaApi.previewUrl(item.localMediaId)}
            alt={item.fileName}
            className="stf-media-preview"
          />
        ) : (
          <video
            src={operatorMediaApi.previewUrl(item.localMediaId)}
            controls
            preload="metadata"
            className="stf-media-preview"
          />
        )}
        {item.mediaType === 'IMAGE' && item.localAvailable !== false && (
          <button
            type="button"
            className="stf-media-expand"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setPreview(item)}
          >
            <ExpandOutlined />
          </button>
        )}
      </div>
      <div className="stf-media-body">
        <div className="stf-mono stf-media-filename" title={item.fileName}>
          {item.fileName}
        </div>
        <div className="stf-muted stf-media-meta">
          <span>{t.mediaTypeLabel[item.mediaType] ?? item.mediaType}</span>
          <span aria-hidden="true">•</span>
          <span>{(item.fileSize / 1_000_000).toFixed(2)} MB</span>
          {item.sourceType && (
            <>
              <span aria-hidden="true">•</span>
              <span>
                {t.mediaSourceLabel[item.sourceType] ?? item.sourceType}
              </span>
            </>
          )}
        </div>
        <StatusTag tone={statusKind}>
          {t.mediaStatusLabel[status] ?? status}
        </StatusTag>
        {item.previewError && (
          <Alert type="error" showIcon message={item.previewError} />
        )}
        <div className="stf-media-actions">
          {canManageMedia && status === 'MANUAL_UPLOAD_REQUIRED' && (
            <Button
              type="primary"
              disabled={isBusy || item.localAvailable === false}
              onClick={() => void approve(item, true)}
            >
              {t.manualUploadFromOriginal}
            </Button>
          )}
          {canManageMedia && (
            <Button
              type="primary"
              style={{ flex: 1 }}
              disabled={isBusy || !canApprove || item.localAvailable === false}
              onClick={() => void approve(item)}
            >
              {busyId === item.localMediaId ? t.processing : t.approveUpload}
            </Button>
          )}
          {item.mediaType === 'IMAGE' && item.localAvailable !== false && (
            <Button onClick={() => setPreview(item)}>
              <span aria-hidden="true">{t.viewShort}</span>
              <span className="stf-sr">{t.enlargePreview}</span>
            </Button>
          )}
          {canManageMedia && (
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  {
                    key: 'discard',
                    danger: true,
                    disabled: isBusy || !canDiscard,
                    label: finishedUploadStatuses.has(status)
                      ? t.deleteLocal
                      : t.discard,
                    onClick: () => void discard(item),
                  },
                ],
              }}
            >
              <Button
                icon={<EllipsisOutlined aria-hidden="true" />}
                aria-label={t.moreActions}
                title={t.moreActions}
              />
            </Dropdown>
          )}
        </div>
        {monitoring.data?.permissions.canAttachChecklistEvidence === true &&
          !monitoring.loading &&
          !monitoring.error && (
            <details
              className="stf-details stf-details--inner"
              open={targetCount > 0}
            >
              <summary>
                {t.attachToChecklist}
                {targetCount > 0 && (
                  <StatusTag tone="info">
                    {t.attachSelected(targetCount)}
                  </StatusTag>
                )}
              </summary>
              <fieldset disabled={isBusy} className="stf-attach">
                {monitoring.data.checklist.executions.map((execution) => (
                  <label key={execution.id} className="stf-attach-row">
                    <Checkbox
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
                    >
                      <span>{execution.content}</span>
                    </Checkbox>
                    <em className="stf-muted">
                      {execution.eligibleEvidenceCount ?? 0}/
                      {execution.minimumEvidenceCount ?? 0}
                    </em>
                  </label>
                ))}
                {item.backendMediaId && (
                  <Button
                    block
                    className="stf-attach-button"
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
                    {t.attachWithoutReupload}
                  </Button>
                )}
              </fieldset>
            </details>
          )}
        {attachFailures[item.localMediaId] && (
          <Alert
            type="error"
            showIcon
            message={t.attachFailedNotice(attachFailures[item.localMediaId])}
          />
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
