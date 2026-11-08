import { Button } from 'antd'
import { useState } from 'react'
import { Modal } from '../ui'
import { requestOriginalMediaDownload, startOriginalMediaDownload } from '../../../../../shared/api/originalMediaDownload'
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

/** Large centered preview: fresh viewing URL, file info, download and paging. */
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
  const shown = fresh.data ?? { ...item, url: null }
  const [downloading, setDownloading] = useState(false)
  const [downloadFailed, setDownloadFailed] = useState(false)

  return (
    <Modal
      title={item.fileName}
      subtitle={missionLabel}
      icon="camera"
      width={920}
      onClose={onClose}
      footer={
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
                  .then((download) => startOriginalMediaDownload(download.downloadUrl))
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
      }
    >
      <div className="md-preview">
        {fresh.loading && !fresh.data && (
          <div className="md-viewer" role="status" aria-busy="true">
            {t.loading}
          </div>
        )}
        {fresh.error !== undefined && !fresh.data && (
          <div className="md-preview-error" role="alert">
            <span>{t.error}</span>
            <Button size="small" onClick={fresh.reload}>
              {t.retry}
            </Button>
          </div>
        )}
        {fresh.data && <MediaViewer item={fresh.data} />}
        {downloadFailed && <div className="md-preview-error" role="alert">{t.downloadFailed}</div>}
        {!shown.canDownloadOriginal && <p role="status">{t.downloadUnavailable}</p>}
        <MediaInfoList item={shown} missionLabel={missionLabel} />
      </div>
    </Modal>
  )
}
