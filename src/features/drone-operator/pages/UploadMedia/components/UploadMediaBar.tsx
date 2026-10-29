import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Progress } from 'antd'
import type { Dispatch, SetStateAction } from 'react'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { LocalMedia } from '../../../../media/api/operatorMediaApi'
import { uploadMediaPageMessages } from '../UploadMediaPage.messages'

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
    <CardComponent>
      <div className="stf-bar">
        <div className="stf-bar-main">
          <div className="stf-row">
            <strong className="stf-bar-count">
              {loadedMedia} / {totalMedia}
            </strong>
            <span className="stf-muted">{t.mediaLoaded}</span>
            {loadedMedia > 0 && (
              <StatusTag tone="success">
                {t.uploadedChip(loadedMedia)}
              </StatusTag>
            )}
            {pendingMedia > 0 && (
              <StatusTag tone="warning">
                {t.pendingChip(pendingMedia)}
              </StatusTag>
            )}
            {uploading > 0 && (
              <StatusTag tone="info">{t.uploadingChip(uploading)}</StatusTag>
            )}
            {manual > 0 && (
              <StatusTag tone="danger">{t.manualChip(manual)}</StatusTag>
            )}
          </div>
          <Progress
            size="small"
            showInfo={false}
            percent={
              totalMedia ? Math.round((loadedMedia / totalMedia) * 100) : 0
            }
            aria-label={t.summary(loadedMedia, totalMedia, uploading, manual)}
          />
          <small className="stf-muted">{t.summaryNote}</small>
        </div>
        <div className="stf-bar-actions">
          <Button
            href={backRoute}
            icon={<ArrowLeftOutlined aria-hidden="true" />}
          >
            {t.backToCockpit}
          </Button>
          <Button
            icon={<ReloadOutlined aria-hidden="true" />}
            onClick={() => {
              refreshWorkspace()
            }}
          >
            {t.refresh}
          </Button>
          {canManageMedia ? (
            <Button
              type="primary"
              disabled={!missionId || isBusy}
              onClick={() => {
                void (async () => {
                  setUploadInfo(null)
                  if (approvable.length === 0) {
                    await refresh()
                    setUploadInfo(
                      referenceCount > 0
                        ? t.uploadAllNoneRef(referenceCount)
                        : t.uploadAllNone,
                    )
                    return
                  }
                  setBatchUploading(true)
                  try {
                    for (const item of approvable) {
                      if (!(await approve(item))) return
                    }
                    setUploadInfo(t.uploadAllSent)
                  } finally {
                    setBatchUploading(false)
                  }
                })()
              }}
            >
              {t.uploadAll}
            </Button>
          ) : (
            <StatusTag tone="neutral">{t.viewOnly}</StatusTag>
          )}
        </div>
      </div>
    </CardComponent>
  )
}
