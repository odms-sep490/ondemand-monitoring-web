export const finishedUploadStatuses = new Set([
  'PENDING_MANAGER_APPROVAL',
  'AVAILABLE',
])

export const visibleAfterControllerDropStatuses = new Set([
  'UPLOADING',
  'VALIDATING',
  'PENDING_MANAGER_APPROVAL',
  'AVAILABLE',
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
  REVIEW_PENDING: 'Chờ duyệt',
  UPLOADING: 'Đang upload',
  UPLOAD_FAILED: 'Upload thất bại',
  VALIDATING: 'Đang xác thực',
  MANUAL_UPLOAD_REQUIRED: 'Cần upload thủ công',
  UPLOAD_PENDING: 'Chờ upload',
  RETRY_REQUIRED: 'Cần thử lại',
  PENDING_MANAGER_APPROVAL: 'Chờ manager duyệt',
  AVAILABLE: 'Đã duyệt',
  UPLOADED: 'Đã upload',
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
