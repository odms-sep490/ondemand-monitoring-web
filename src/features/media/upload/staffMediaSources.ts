import type { LocalMedia } from '../api/operatorMediaApi'
import { operatorMediaApi } from '../api/operatorMediaApi'

/** Only Flight Controller media may resolve a local file. Display URLs never select S3 originals. */
export function staffMediaSources(
  item: LocalMedia,
  remotePreview?: string | null,
  remoteThumbnail?: string | null,
) {
  const local =
    item.uploadChannel !== 'STAFF_FILE' && item.localAvailable !== false
  const localPreview = local
    ? (item.localPreviewUrl ?? operatorMediaApi.previewUrl(item.localMediaId))
    : undefined
  const localPoster =
    local && item.mediaType === 'VIDEO'
      ? (item.localThumbnailUrl ??
        operatorMediaApi.thumbnailUrl(item.localMediaId))
      : undefined
  const preview = remotePreview ?? item.previewUrl
  const thumbnail = remoteThumbnail ?? item.thumbnailUrl
  return {
    images: [
      ...new Set(
        [localPreview, thumbnail, preview].filter((url): url is string =>
          Boolean(url),
        ),
      ),
    ],
    viewImages: [
      ...new Set(
        [localPreview, preview, thumbnail].filter((url): url is string =>
          Boolean(url),
        ),
      ),
    ],
    videos: [
      ...new Set(
        [localPreview, preview].filter((url): url is string => Boolean(url)),
      ),
    ],
    poster: localPoster ?? thumbnail,
    fallbackPoster: thumbnail,
    localPreview,
  }
}
