export interface UploadedMissionMedia {
  mediaId: string
  missionId: string
  deviceId: string
  mediaType: string
  status?:
    | 'UPLOAD_PENDING'
    | 'UPLOADING'
    | 'VALIDATING'
    | 'RETRY_REQUIRED'
    | 'MANUAL_UPLOAD_REQUIRED'
    | 'PENDING_MANAGER_APPROVAL'
    | 'AVAILABLE'
    | 'REJECTED'
  fileName: string
  contentType: string
  fileSize: number
  capturedAt: string | null
  availableAt: string | null
  /** Original URL is withheld until payment and delivery are complete. */
  downloadUrl: string | null
  urlExpiresAt?: string
  /** Capture provenance; null/undefined means unknown legacy source. */
  sourceType?: string | null
  sourceReferenceId?: string | null
  sourceCapturedAt?: string | null
  captureLatitude?: number | null
  captureLongitude?: number | null
  sourceDistanceMeters?: number | null
}

export interface UploadedMissionMediaPage {
  items: UploadedMissionMedia[]
  page: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}

export type MissionMediaReviewStatus =
  'DRAFT' | 'PENDING_MANAGER_APPROVAL' | 'APPROVED' | 'REJECTED'

export interface MissionMediaReader {
  list(
    missionId: string,
    page: number,
    signal?: AbortSignal,
  ): Promise<UploadedMissionMediaPage>
  get(
    missionId: string,
    mediaId: string,
    signal?: AbortSignal,
  ): Promise<UploadedMissionMedia>
}
