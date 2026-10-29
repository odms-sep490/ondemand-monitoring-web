import { defineMessages } from '../../../../shared/i18n'

export const uploadMediaPageMessages = defineMessages({
  vi: {
    mediaTypeLabel: { IMAGE: 'Ảnh', VIDEO: 'Video' },
    mediaSourceLabel: {
      DRONE_CAMERA: 'Camera drone',
      SATELLITE_SNAPSHOT: 'Ảnh vệ tinh',
      MANUAL_UPLOAD: 'Tải lên thủ công',
      MAPILLARY_REFERENCE: 'Ảnh tham chiếu Mapillary',
    },
    mediaStatusLabel: {
      REVIEW_PENDING: 'Chờ duyệt',
      UPLOADING: 'Đang upload',
      UPLOAD_FAILED: 'Tải lên thất bại',
      VALIDATING: 'Đang xác thực',
      MANUAL_UPLOAD_REQUIRED: 'Cần tải lên thủ công',
      UPLOAD_PENDING: 'Chờ tải lên',
      RETRY_REQUIRED: 'Cần thử lại',
      PENDING_MANAGER_APPROVAL: 'Chờ quản lý duyệt',
      AVAILABLE: 'Đã duyệt',
      UPLOADED: 'Đã tải lên',
    } as Record<string, string>,
    originalUnavailable:
      'Bản gốc trên Flight Controller không khả dụng. Chọn bản sao PC để khôi phục.',
    manualUploadFromOriginal: 'Tải lên thủ công từ bản gốc',
    attachWithoutReupload: 'Gắn bằng chứng — không tải lên lại',
    attachFailedNotice: (reason: string) =>
      `Media đã được giữ. Gắn bằng chứng chưa thành công: ${reason}. Chọn “Gắn bằng chứng” để thử lại, không tải lên lại.`,
    uploadAllNoneRef: (n: number) =>
      `Tất cả media đã được lưu (${n} ảnh tham chiếu). Không còn file nào chờ tải lên.`,
    uploadAllNone: 'Không có file nào chờ tải lên.',
    uploadAllSent:
      'Đã gửi các file đang chờ. Trạng thái lưu/xác thực được cập nhật từ hệ thống.',
    stepTitle: 'Upload media',
    uploadPermissionNote:
      'Tải lên ảnh cần Pilot hoặc Inspector đã nhận nhiệm vụ. Bạn vẫn có thể xem media và cập nhật checklist nếu được phân công giám sát.',
    inspectorContact: 'Liên hệ người nghiệm thu',
    managerContact: 'Liên hệ quản lý',
    notUpdated: 'Chưa cập nhật',
    phoneNotUpdated: 'Chưa cập nhật số điện thoại',
    callInspector: (phone: string) => `Gọi ${phone}`,
    callManager: (phone: string) => `Gọi ${phone}`,
    responseStatus: (status?: string | null) =>
      status === 'ACCEPTED'
        ? 'Đã nhận nhiệm vụ'
        : status === 'REJECTED'
          ? 'Đã từ chối nhiệm vụ'
          : 'Chờ nhận nhiệm vụ',
    checkingPermissions: 'Đang xác nhận quyền tải lên…',
    permissionsUnavailable:
      'Không tải được quyền tải lên. Bấm Làm mới để thử lại.',
    enlargePreview: 'Xem ảnh lớn',
    closePreview: 'Đóng ảnh',
    openingMission: 'Đang mở nhiệm vụ',
    summary: (
      uploaded: number,
      total: number,
      uploading: number,
      manual: number,
    ) =>
      `${uploaded}/${total} file đã lên${uploading ? ` · ${uploading} đang lên` : ''}${manual ? ` · ${manual} cần xử lý thủ công` : ''}`,
    summaryNote: 'File local được giữ đến khi duyệt hoặc xóa.',
    mediaLoaded: 'media đã tải',
    uploadedChip: (n: number) => `${n} đã tải lên`,
    pendingChip: (n: number) => `${n} chờ xử lý`,
    uploadingChip: (n: number) => `${n} đang tải`,
    manualChip: (n: number) => `${n} cần thủ công`,
    sendBlocked:
      'Hoàn tất checklist và tải lên đủ bằng chứng trước khi gửi quản lý.',
    mediaList: 'Danh sách media',
    fileCount: (n: number) => `${n} file`,
    sortNewest: 'Mới nhất',
    sortOldest: 'Cũ nhất',
    filterAll: 'Tất cả',
    filterLabel: 'Lọc trạng thái',
    sortLabel: 'Sắp xếp',
    filterPending: 'Chờ xử lý',
    filterUploaded: 'Đã tải lên',
    gridView: 'Dạng lưới',
    listView: 'Dạng danh sách',
    viewShort: 'Xem',
    moreActions: 'Thêm thao tác',
    attachToChecklist: 'Gắn vào checklist',
    attachSelected: (n: number) => `${n} mục`,
    fileTable: (n: number) => `Danh sách file (${n})`,
    emptyMedia: 'Chưa có media nào.',
    backToCockpit: 'Quay lại buồng lái',
    backToResult: 'Quay lại kết quả',
    refresh: 'Làm mới',
    uploadAll: 'Tải lên tất cả',
    missingChecklistEvidence:
      'Checklist chưa đủ bằng chứng hợp lệ. tải lên media trước khi gửi quản lý.',
    viewOnly: 'Chỉ xem media',
    restoringMission: 'Đang khôi phục nhiệm vụ đang mở...',
    loadingMedia: 'Đang tải media…',
    confirmDiscard: (fileName: string) =>
      `Xóa bản local ${fileName} trên Flight Controller?`,
    processing: 'Đang xử lý…',
    approveUpload: 'Tải lên ảnh',
    deleteLocal: 'Xóa bản local',
    discard: 'Discard',
    loadMediaFailed: 'Không tải được media trên Flight Controller',
    uploadFailed: 'Tải lên thất bại',
    deleteFailed: 'Không xóa được media',
  },
  en: {
    mediaTypeLabel: { IMAGE: 'Photo', VIDEO: 'Video' },
    mediaSourceLabel: {
      DRONE_CAMERA: 'Drone camera',
      SATELLITE_SNAPSHOT: 'Satellite image',
      MANUAL_UPLOAD: 'Manual upload',
      MAPILLARY_REFERENCE: 'Mapillary reference image',
    },
    mediaStatusLabel: {
      REVIEW_PENDING: 'Awaiting review',
      UPLOADING: 'Uploading',
      UPLOAD_FAILED: 'Upload failed',
      VALIDATING: 'Validating',
      MANUAL_UPLOAD_REQUIRED: 'Manual upload needed',
      UPLOAD_PENDING: 'Awaiting upload',
      RETRY_REQUIRED: 'Retry needed',
      PENDING_MANAGER_APPROVAL: 'Awaiting manager approval',
      AVAILABLE: 'Approved',
      UPLOADED: 'Uploaded',
    } as Record<string, string>,
    originalUnavailable:
      'The original on the Flight Controller is unavailable. Pick the PC copy to restore it.',
    manualUploadFromOriginal: 'Upload manually from the original',
    attachWithoutReupload: 'Attach evidence — no re-upload',
    attachFailedNotice: (reason: string) =>
      `The media was kept. Attaching evidence failed: ${reason}. Choose "Attach evidence" to retry without re-uploading.`,
    uploadAllNoneRef: (n: number) =>
      `All media is stored (${n} reference image(s)). No file is waiting for upload.`,
    uploadAllNone: 'No file is waiting for upload.',
    uploadAllSent:
      'Pending files were sent. Storage and validation status is refreshed from the backend.',
    uploadPermissionNote:
      'Uploading requires an accepted Pilot or Inspector assignment. You can still view media and update the checklist if assigned to monitoring.',
    inspectorContact: 'Inspector contact',
    managerContact: 'Manager contact',
    notUpdated: 'Not updated',
    phoneNotUpdated: 'Phone number not updated',
    callInspector: (phone: string) => `Call ${phone}`,
    callManager: (phone: string) => `Call ${phone}`,
    responseStatus: (status?: string | null) =>
      status === 'ACCEPTED'
        ? 'Assignment accepted'
        : status === 'REJECTED'
          ? 'Assignment rejected'
          : 'Awaiting acceptance',
    checkingPermissions: 'Checking upload permissions…',
    permissionsUnavailable:
      'Could not load upload permissions. Refresh to retry.',
    enlargePreview: 'Enlarge image',
    closePreview: 'Close image',
    stepTitle: 'Upload media',
    openingMission: 'Opening mission',
    summary: (
      uploaded: number,
      total: number,
      uploading: number,
      manual: number,
    ) =>
      `${uploaded}/${total} files uploaded${uploading ? ` · ${uploading} uploading` : ''}${manual ? ` · ${manual} need manual review` : ''}`,
    summaryNote: 'Local files are kept until approved or deleted.',
    mediaLoaded: 'media uploaded',
    uploadedChip: (n: number) => `${n} uploaded`,
    pendingChip: (n: number) => `${n} pending`,
    uploadingChip: (n: number) => `${n} uploading`,
    manualChip: (n: number) => `${n} need manual upload`,
    sendBlocked:
      'Complete the checklist and upload enough evidence before sending to the manager.',
    mediaList: 'Media',
    fileCount: (n: number) => `${n} file(s)`,
    sortNewest: 'Newest',
    sortOldest: 'Oldest',
    filterAll: 'All',
    filterLabel: 'Filter by status',
    sortLabel: 'Sort',
    filterPending: 'Pending',
    filterUploaded: 'Uploaded',
    gridView: 'Grid view',
    listView: 'List view',
    viewShort: 'View',
    moreActions: 'More actions',
    attachToChecklist: 'Attach to checklist',
    attachSelected: (n: number) => `${n} item(s)`,
    fileTable: (n: number) => `File list (${n})`,
    emptyMedia: 'No media yet.',
    backToCockpit: 'Back to cockpit',
    backToResult: 'Back to results',
    refresh: 'Refresh',
    uploadAll: 'Upload all',
    missingChecklistEvidence:
      'The checklist does not have enough valid evidence. Upload media before sending to the manager.',
    viewOnly: 'View only',
    restoringMission: 'Restoring the open mission...',
    loadingMedia: 'Loading media…',
    confirmDiscard: (fileName: string) =>
      `Delete the local copy of ${fileName} on the Flight Controller?`,
    processing: 'Processing…',
    approveUpload: 'Upload media',
    deleteLocal: 'Delete local copy',
    discard: 'Discard',
    loadMediaFailed: 'Could not load media from the Flight Controller',
    uploadFailed: 'Upload failed',
    deleteFailed: 'Could not delete the media',
  },
})
