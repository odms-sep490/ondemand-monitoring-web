import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import { fmtDate } from '../../../lib/orderStatus'
import { formatBytes } from '../../../lib/media/mapMedia'
import type { MediaItem } from '../../../lib/media/types'
import { mediaCardMessages } from './MediaCard.messages'
import { mediaUiMessages } from './mediaUi'

type Props = { item: MediaItem; onOpen: (item: MediaItem) => void }

/** One asset tile; the whole card opens the preview. */
export function MediaCard({ item, onOpen }: Props) {
  const { t, locale } = useI18n(mediaCardMessages)
  const { t: ui } = useI18n(mediaUiMessages)
  const size = formatBytes(item.fileSize)
  const captured = item.capturedAt ? fmtDate(item.capturedAt, locale) : null
  const source =
    item.sourceType && Object.hasOwn(ui.source, item.sourceType)
      ? ui.source[item.sourceType as keyof typeof ui.source]
      : null

  return (
    <button
      type="button"
      className="md-card"
      aria-label={t.open(item.fileName)}
      disabled={!item.url}
      onClick={() => onOpen(item)}
    >
      <span className="md-thumb">
        {item.kind === 'image' && item.url ? (
          <img src={item.url} alt="" loading="lazy" />
        ) : (
          <Icon name="camera" width={32} height={32} aria-hidden="true" />
        )}
        <span className={`md-kind md-kind--${item.kind}`}>
          {ui.kind[item.kind]}
        </span>
        <span className="md-open-label">{item.url ? t.view : t.locked}</span>
      </span>
      <span className="md-card-body">
        <span className="md-name">{item.fileName}</span>
        <span className="md-meta">
          {source && <span>{source}</span>}
          {size && <span>{size}</span>}
          {captured && <span>{captured}</span>}
        </span>
      </span>
    </button>
  )
}
