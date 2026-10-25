import type {
  CustomerMediaNotificationResponse,
  CustomerMediaResponse,
  MediaFilter,
  MediaItem,
  MediaKind,
  MediaMissionGroup,
  MediaNotification,
} from './types'

/** BE `mediaType` is IMAGE | VIDEO | STREAMING; fall back to the MIME type. */
export function mediaKind(
  mediaType: string | undefined,
  contentType: string | undefined,
): MediaKind {
  const type = mediaType?.toUpperCase()
  if (type === 'IMAGE') return 'image'
  if (type === 'VIDEO') return 'video'
  const mime = contentType?.toLowerCase() ?? ''
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  return 'other'
}

export function toMediaItem(dto: CustomerMediaResponse): MediaItem {
  return {
    ...(dto.sourceType !== undefined ? { sourceType: dto.sourceType } : {}),
    id: dto.mediaId,
    missionId: dto.missionId,
    deviceId: dto.deviceId ?? null,
    kind: mediaKind(dto.mediaType, dto.contentType),
    fileName: dto.fileName?.trim() || dto.mediaId,
    contentType: dto.contentType ?? null,
    fileSize: dto.fileSize ?? null,
    capturedAt: dto.capturedAt ?? null,
    availableAt: dto.availableAt ?? null,
    url: dto.downloadUrl ?? null,
  }
}

export function toMediaNotification(
  dto: CustomerMediaNotificationResponse,
): MediaNotification {
  return {
    id: dto.notificationId,
    mediaId: dto.mediaId,
    missionId: dto.missionId,
    eventType: dto.eventType ?? '',
    createdAt: dto.createdAt ?? null,
  }
}

const time = (iso: string | null) => (iso ? new Date(iso).getTime() || 0 : 0)

/** Newest capture first, like a gallery. */
export function sortNewestFirst(items: MediaItem[]): MediaItem[] {
  return [...items].sort(
    (a, b) =>
      time(b.capturedAt ?? b.availableAt) - time(a.capturedAt ?? a.availableAt),
  )
}

export function filterMedia(
  items: MediaItem[],
  filter: MediaFilter,
): MediaItem[] {
  const query = filter.query.trim().toLowerCase()
  return items.filter((item) => {
    if (filter.missionId && item.missionId !== filter.missionId) return false
    if (filter.kind !== 'all' && item.kind !== filter.kind) return false
    return !query || item.fileName.toLowerCase().includes(query)
  })
}

/** Uuid ids are shortened for display, like order codes. */
export function shortId(id: string): string {
  return id.length > 12 ? id.slice(0, 8).toUpperCase() : id
}

/** One entry per mission; `labels` maps a missionId to its mission code. */
export function groupByMission(
  items: MediaItem[],
  labels: Record<string, string> = {},
): MediaMissionGroup[] {
  const groups = new Map<string, MediaMissionGroup>()
  for (const item of items) {
    const group = groups.get(item.missionId)
    if (group) group.count += 1
    else {
      groups.set(item.missionId, {
        missionId: item.missionId,
        label: labels[item.missionId] ?? shortId(item.missionId),
        count: 1,
      })
    }
  }
  return [...groups.values()]
}

export function formatBytes(bytes: number | null): string | null {
  if (bytes === null) return null
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`
  return `${bytes} B`
}

/** Previous / next item within the same mission, by capture order. */
export function siblings(
  items: MediaItem[],
  current: { id: string; missionId: string },
): { prev: MediaItem | null; next: MediaItem | null } {
  const sameMission = sortNewestFirst(items).filter(
    (i) => i.missionId === current.missionId,
  )
  const index = sameMission.findIndex((i) => i.id === current.id)
  if (index < 0) return { prev: null, next: null }
  return {
    prev: sameMission[index - 1] ?? null,
    next: sameMission[index + 1] ?? null,
  }
}
