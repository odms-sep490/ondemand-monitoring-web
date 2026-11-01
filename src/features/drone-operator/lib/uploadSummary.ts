import type { MediaFile } from '../types/mission'

export type UploadSummary = {
  nTotal: number
  nUploaded: number
  nUploading: number
  nManual: number
  isDone: boolean
  isEmpty: boolean
}

/** Aggregates a media upload queue into counts used by the OPR-08W header banner
 * and the mock `/media` handler so the rules live in one place. */
export function uploadSummary(files: MediaFile[]): UploadSummary {
  const nTotal = files.length
  const nUploaded = files.filter((file) =>
    [
      'UPLOADED',
      'VALIDATING',
      'PENDING_MANAGER_APPROVAL',
      'AVAILABLE',
      'REJECTED',
    ].includes(file.status),
  ).length
  const nUploading = files.filter((f) => f.status === 'UPLOADING').length
  const nManual = files.filter((f) => f.manualTaskCreated).length
  return {
    nTotal,
    nUploaded,
    nUploading,
    nManual,
    isDone: nTotal > 0 && nUploaded === nTotal,
    isEmpty: nTotal === 0,
  }
}
