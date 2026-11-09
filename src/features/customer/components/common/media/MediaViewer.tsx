import { ResilientMedia } from '../../../../../shared/components/media/MediaRecovery'
import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import type { MediaItem } from '../../../lib/media/types'
import { mediaViewerMessages } from './MediaViewer.messages'

/** Image / video player for a media item with a (fresh) viewing URL. */
export function MediaViewer({ item }: { item: MediaItem }) {
  const { t } = useI18n(mediaViewerMessages)
  if (!item.previewUrl) {
    const statusMessage =
      item.derivativeStatus === 'FAILED'
        ? t.previewFailed
        : item.derivativeStatus === 'UNSUPPORTED'
          ? t.previewUnsupported
          : item.derivativeStatus === 'PENDING' ||
              item.derivativeStatus === 'PROCESSING'
            ? t.previewProcessing
            : t.noUrl
    return (
      <div className="md-viewer" role="status">
        {statusMessage}
      </div>
    )
  }
  return (
    <div className="md-viewer">
      {item.kind === 'image' && (
        <ResilientMedia
          kind="image"
          src={item.previewUrl}
          mediaId={item.id}
          fileName={item.fileName}
          fileSize={item.fileSize}
          original={item.derivativeStatus !== 'READY'}
        />
      )}
      {item.kind === 'video' && (
        <ResilientMedia
          kind="video"
          src={item.previewUrl}
          poster={item.thumbnailUrl}
          mediaId={item.id}
          fileName={item.fileName}
          fileSize={item.fileSize}
          original={item.derivativeStatus !== 'READY'}
        />
      )}
      {item.kind === 'other' && (
        <div>
          <Icon name="file-text" width={32} height={32} aria-hidden="true" />
          <p>{t.noPreview}</p>
        </div>
      )}
    </div>
  )
}
