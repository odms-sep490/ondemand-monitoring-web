import { Modal } from '../ui'
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

  return (
    <Modal
      title={item.fileName}
      subtitle={missionLabel}
      icon="camera"
      width={920}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="odm-btn odm-btn-gh" disabled={!onPrev} onClick={onPrev}>
            {t.prev}
          </button>
          <button type="button" className="odm-btn odm-btn-gh" disabled={!onNext} onClick={onNext}>
            {t.next}
          </button>
          <span className="md-footer-spacer" />
          {showDetailLink && (
            <a
              className="odm-btn odm-btn-gh"
              href={customerHref({ screen: 'mediaDetail', mediaId: item.id })}
            >
              {t.detail}
            </a>
          )}
          {fresh.data?.url ? (
            <a
              className="odm-btn odm-btn-p"
              href={fresh.data.url}
              download={item.fileName}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.download}
            </a>
          ) : (
            <button type="button" className="odm-btn odm-btn-p" disabled>
              {t.download}
            </button>
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
            <button type="button" className="odm-btn odm-btn-gh odm-btn-sm" onClick={fresh.reload}>
              {t.retry}
            </button>
          </div>
        )}
        {fresh.data && <MediaViewer item={fresh.data} />}
        <MediaInfoList item={shown} missionLabel={missionLabel} />
      </div>
    </Modal>
  )
}
