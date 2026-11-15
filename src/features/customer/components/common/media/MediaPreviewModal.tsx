import { Button, Popover } from 'antd'
import { ImagePreview } from '../../../../../shared/components/media/ImagePreview'
import { useState } from 'react'
import { Modal } from '../ui'
import {
  requestOriginalMediaDownload,
  startOriginalMediaDownload,
} from '../../../../../shared/api/originalMediaDownload'
import { useI18n } from '../../../../../shared/i18n'
import type { MediaItem } from '../../../lib/media/types'
import { customerHref } from '../../../routes'
import { MediaInfoList } from './MediaInfoList'
import { MediaViewer } from './MediaViewer'
import { mediaPreviewModalMessages } from './MediaPreviewModal.messages'
import { useFreshMedia } from './useFreshMedia'

type Props = {
  item: MediaItem
  missionLabel: string
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  /** Link to the full-page detail; hidden where the page is already the detail. */
  showDetailLink?: boolean
}

/** Fresh viewing access, fullscreen images, file info, download and paging. */
export function MediaPreviewModal({
  item,
  missionLabel,
  onClose,
  onPrev,
  onNext,
  showDetailLink = true,
}: Props) {
  const { t } = useI18n(mediaPreviewModalMessages)
  const fresh = useFreshMedia(item.missionId, item.id)
  const current = fresh.data?.id === item.id ? fresh.data : undefined
  const shown = current ?? { ...item, url: null }
  const [downloading, setDownloading] = useState(false)
  const [downloadFailed, setDownloadFailed] = useState(false)

  const actions = (
    <>
      <Button disabled={!onPrev} onClick={onPrev}>
        {t.prev}
      </Button>
      <Button disabled={!onNext} onClick={onNext}>
        {t.next}
      </Button>
      <span className="md-footer-spacer" />
      {showDetailLink && (
        <Button
          href={customerHref({ screen: 'mediaDetail', mediaId: item.id })}
        >
          {t.detail}
        </Button>
      )}
      {shown.canDownloadOriginal ? (
        <Button
          type="primary"
          loading={downloading}
          onClick={() => {
            setDownloading(true)
            setDownloadFailed(false)
            void requestOriginalMediaDownload(item.id)
              .then((download) =>
                startOriginalMediaDownload(download.downloadUrl),
              )
              .catch(() => setDownloadFailed(true))
              .finally(() => setDownloading(false))
          }}
        >
          {t.download}
        </Button>
      ) : (
        <Button type="primary" disabled title={t.downloadUnavailable}>
          {t.download}
        </Button>
      )}
    </>
  )

  if (item.kind === 'image' && current?.previewUrl) {
    return (
      <ImagePreview
        src={current.previewUrl}
        fileName={current.fileName}
        mediaId={current.id}
        fileSize={current.fileSize}
        original={current.derivativeStatus !== 'READY'}
        visible
        viewerOnly
        onVisibleChange={(visible) => {
          if (!visible) onClose()
        }}
        toolbarExtra={
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Popover
              trigger="click"
              zIndex={1100}
              content={
                <MediaInfoList item={shown} missionLabel={missionLabel} />
              }
            >
              <Button>{current.fileName}</Button>
            </Popover>
            {actions}
            {downloadFailed && <span role="alert">{t.downloadFailed}</span>}
            {!shown.canDownloadOriginal && (
              <span role="status">{t.downloadUnavailable}</span>
            )}
          </div>
        }
      />
    )
  }

  return (
    <Modal
      title={item.fileName}
      subtitle={missionLabel}
      icon="camera"
      width={920}
      onClose={onClose}
      footer={actions}
    >
      <div className="md-preview">
        {fresh.loading && !current && (
          <div className="md-viewer" role="status" aria-busy="true">
            {t.loading}
          </div>
        )}
        {fresh.error !== undefined && !current && (
          <div className="md-preview-error" role="alert">
            <span>{t.error}</span>
            <Button size="small" onClick={fresh.reload}>
              {t.retry}
            </Button>
          </div>
        )}
        {current && <MediaViewer item={current} />}
        {downloadFailed && (
          <div className="md-preview-error" role="alert">
            {t.downloadFailed}
          </div>
        )}
        {!shown.canDownloadOriginal && (
          <p role="status">{t.downloadUnavailable}</p>
        )}
        <MediaInfoList item={shown} missionLabel={missionLabel} />
      </div>
    </Modal>
  )
}
