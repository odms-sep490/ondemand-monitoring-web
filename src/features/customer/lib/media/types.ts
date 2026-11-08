/** `CustomerMediaResponse` (available-media, mission media, media download). */
export type CustomerMediaResponse = {
  mediaId: string
  missionId: string
  deviceId?: string
  /** BE enum `MediaType`: IMAGE | VIDEO | STREAMING. */
  mediaType?: string
  /** Null/undefined denotes unknown legacy capture provenance. */
  sourceType?: string | null
  fileName?: string
  contentType?: string
  fileSize?: number
  capturedAt?: string | null
  availableAt?: string | null
  /** Legacy field retained for wire compatibility; never use it for preview or download actions. */
  downloadUrl?: string | null
  thumbnailUrl?: string | null
  previewUrl?: string | null
  derivativeStatus?: MediaDerivativeStatus | null
  canDownloadOriginal?: boolean
}

/** `PageResponse<T>` as returned by the customer mission media endpoint. */
export type PageResponse<T> = {
  items: T[]
  page: number
  size?: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}

export type MediaKind = 'image' | 'video' | 'other'
export type MediaDerivativeStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'READY'
  | 'FAILED'
  | 'UNSUPPORTED'

export type MediaItem = {
  sourceType?: string | null
  id: string
  missionId: string
  deviceId: string | null
  kind: MediaKind
  fileName: string
  contentType: string | null
  fileSize: number | null
  capturedAt: string | null
  availableAt: string | null
  url: string | null
  thumbnailUrl?: string | null
  previewUrl?: string | null
  derivativeStatus?: MediaDerivativeStatus | null
  canDownloadOriginal?: boolean
}

export type MediaMissionGroup = {
  missionId: string
  label: string
  count: number
}

export type MediaFilter = {
  missionId: string | null
  kind: MediaKind | 'all'
  query: string
}
