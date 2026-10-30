/** Transfer is complete once the server has accepted/stored the file, even if review later rejects it. */
export const successfullyUploadedStatuses = new Set([
  'VALIDATING',
  'PENDING_MANAGER_APPROVAL',
  'AVAILABLE',
  'REJECTED',
])

/** Only these states can be used as checklist evidence. */
export const evidenceEligibleUploadStatuses = new Set([
  'PENDING_MANAGER_APPROVAL',
  'AVAILABLE',
])

export const visibleAfterControllerDropStatuses = new Set([
  'UPLOADING',
  'VALIDATING',
  'PENDING_MANAGER_APPROVAL',
  'AVAILABLE',
  'REJECTED',
])

export const mediaTypeLabel: Record<string, string> = {
  IMAGE: 'Ảnh',
  VIDEO: 'Video',
}

export const mediaSourceLabel: Record<string, string> = {
  DRONE_CAMERA: 'Camera drone',
  SATELLITE_SNAPSHOT: 'Ảnh vệ tinh',
  MANUAL_UPLOAD: 'Upload thủ công',
  MAPILLARY_REFERENCE: 'Ảnh tham chiếu Mapillary',
}

export const mediaStatusLabel: Record<string, string> = {
  REVIEW_PENDING: 'Chờ tải lên',
  UPLOADING: 'Đang tải lên',
  UPLOAD_FAILED: 'Tải lên thất bại',
  VALIDATING: 'Đang xác thực',
  MANUAL_UPLOAD_REQUIRED: 'Cần tải thủ công',
  UPLOAD_PENDING: 'Chờ tải lên',
  RETRY_REQUIRED: 'Cần tải lại',
  PENDING_MANAGER_APPROVAL: 'Chờ Manager duyệt',
  AVAILABLE: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  UPLOADED: 'Đã tải lên',
}

/** Existing upload layout backed by the selected mission's local media. */
/** Maps a backend media status to a chip tone. */
export function statusTone(status: string) {
  if (/FAIL|REJECT|ERROR|MANUAL_UPLOAD_REQUIRED/.test(status))
    return 'is-danger'
  if (/PENDING|VALIDATING|UPLOADING|REVIEW/.test(status)) return 'is-warning'
  if (/AVAILABLE|UPLOADED|VALIDATED|STORED|COMPLETED|READY/.test(status))
    return 'is-success'
  return ''
}
