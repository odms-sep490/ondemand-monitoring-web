import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import type { MediaItem } from '../../../lib/media/types'
import { mediaViewerMessages } from './MediaViewer.messages'

/** Image / video player for a media item with a (fresh) viewing URL. */
export function MediaViewer({ item }: { item: MediaItem }) {
  const { t } = useI18n(mediaViewerMessages)
  if (!item.previewUrl) {
    return (
      <div className="md-viewer" role="status">
        {t.noUrl}
      </div>
    )
  }
  return (
    <div className="md-viewer">
      {item.kind === 'image' && <img src={item.previewUrl!} alt={item.fileName} />}
      {item.kind === 'video' && (
        <video src={item.previewUrl!} controls preload="none" aria-label={item.fileName} />
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
