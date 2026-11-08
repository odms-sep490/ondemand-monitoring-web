import { useMediaRecovery } from '../../../../../shared/components/media/useMediaRecovery'
import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import { fmtDate } from '../../../lib/orderStatus'
import { formatBytes } from '../../../lib/media/mapMedia'
import type { MediaItem } from '../../../lib/media/types'
import { mediaCardMessages } from './MediaCard.messages'
import { mediaUiMessages } from './mediaUi'

type Props = {
  item: MediaItem
  missionLabel?: string
  onOpen: (item: MediaItem) => void
}

/** One asset tile; the whole card opens the preview. */
export function MediaCard({ item, missionLabel, onOpen }: Props) {
  const { t, locale } = useI18n(mediaCardMessages)
  const { t: ui } = useI18n(mediaUiMessages)
  const recovery = useMediaRecovery({
    src: item.thumbnailUrl ?? '',
    alternateSrc:
      item.kind === 'image' ? (item.previewUrl ?? undefined) : undefined,
    mediaId: item.kind === 'image' ? item.id : undefined,
    fileSize: item.fileSize,
    original: item.derivativeStatus !== 'READY',
  })
  const size = formatBytes(item.fileSize)
  const captured = item.capturedAt ? fmtDate(item.capturedAt, locale) : null
  const source =
    item.sourceType && Object.hasOwn(ui.source, item.sourceType)
      ? ui.source[item.sourceType as keyof typeof ui.source]
      : null
  const metaParts = [source, size, captured].filter(Boolean)
  const previewLabel =
    item.derivativeStatus === 'FAILED'
      ? t.previewFailed
      : item.derivativeStatus === 'UNSUPPORTED'
        ? t.previewUnsupported
        : item.derivativeStatus === 'PENDING' ||
            item.derivativeStatus === 'PROCESSING'
          ? t.previewProcessing
          : t.locked

  return (
    <button
      type="button"
      className="md-card"
      aria-label={t.open(item.fileName)}
      disabled={!item.previewUrl && !item.canDownloadOriginal}
      onClick={() => onOpen(item)}
    >
      <span className="md-thumb">
        {(item.kind === 'image' || item.kind === 'video') &&
        recovery.source &&
        !recovery.failed &&
        !recovery.loading &&
        !recovery.paused ? (
          <img
            src={recovery.source}
            alt=""
            loading="lazy"
            decoding="async"
            onError={recovery.onError}
          />
        ) : (
          <Icon name="camera" width={32} height={32} aria-hidden="true" />
        )}
        <span className={`md-kind md-kind--${item.kind}`}>
          {ui.kind[item.kind]}
        </span>
        {missionLabel && (
          <span className="md-mission-badge">{missionLabel}</span>
        )}
        <span className="md-open-label">
          {item.previewUrl ? t.view : previewLabel}
        </span>
      </span>
      <span className="md-card-body">
        <span className="md-name" title={item.fileName}>
          {item.fileName}
        </span>
        <span className="md-meta">{metaParts.join(' • ')}</span>
      </span>
    </button>
  )
}
