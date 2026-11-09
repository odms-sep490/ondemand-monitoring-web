import { apiRequest } from './httpClient'

export type OriginalMediaDownloadResponse = {
  mediaId: string
  fileName: string
  downloadUrl: string
  expiresAt: string
}

/** Requests a short-lived original URL; the server rechecks delivery eligibility. */
export function requestOriginalMediaDownload(mediaId: string) {
  return apiRequest<OriginalMediaDownloadResponse>(
    `/api/customer/media/${encodeURIComponent(mediaId)}/download-url`,
    { method: 'POST' },
  )
}

/** S3 responds with Content-Disposition: attachment for the original object. */
export function startOriginalMediaDownload(downloadUrl: string) {
  window.location.assign(downloadUrl)
}
