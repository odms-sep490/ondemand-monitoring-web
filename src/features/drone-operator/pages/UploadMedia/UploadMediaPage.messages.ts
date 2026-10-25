import { defineMessages } from '../../../../shared/i18n'

export const uploadMediaPageMessages = defineMessages({
  vi: {
    stepTitle: 'Upload media',
    uploadPermissionNote:
      'Upload ảnh cần Pilot hoặc Inspector đã nhận nhiệm vụ. Bạn vẫn có thể xem media và cập nhật checklist nếu được phân công giám sát.',
    inspectorContact: 'Liên hệ người nghiệm thu',
    managerContact: 'Liên hệ Manager',
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
    checkingPermissions: 'Đang xác nhận quyền upload…',
    permissionsUnavailable:
      'Không tải được quyền upload. Bấm Làm mới để thử lại.',
    enlargePreview: 'Xem ảnh lớn',
    closePreview: 'Đóng ảnh',
    openingMission: 'Đang mở mission',
    summary: (
      uploaded: number,
      total: number,
      uploading: number,
      manual: number,
    ) =>
      `${uploaded}/${total} file đã lên${uploading ? ` · ${uploading} đang lên` : ''}${manual ? ` · ${manual} cần xử lý thủ công` : ''}`,
    summaryNote: 'File local được giữ đến khi duyệt hoặc xóa.',
    mediaLoaded: 'media đã tải',
    uploadedChip: (n: number) => `${n} đã upload`,
    pendingChip: (n: number) => `${n} chờ xử lý`,
    uploadingChip: (n: number) => `${n} đang tải`,
    manualChip: (n: number) => `${n} cần thủ công`,
    sendBlocked:
      'Hoàn tất checklist và upload đủ bằng chứng trước khi gửi manager.',
    mediaList: 'Danh sách media',
    fileCount: (n: number) => `${n} file`,
    sortNewest: 'Mới nhất',
    sortOldest: 'Cũ nhất',
    filterAll: 'Tất cả',
    filterLabel: 'Lọc trạng thái',
    sortLabel: 'Sắp xếp',
    filterPending: 'Chờ xử lý',
    filterUploaded: 'Đã upload',
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
    uploadAll: 'Upload tất cả',
    missingChecklistEvidence:
      'Checklist chưa đủ bằng chứng hợp lệ. Upload media trước khi gửi manager.',
    viewOnly: 'Chỉ xem media',
    restoringMission: 'Đang khôi phục mission đang mở...',
    loadingMedia: 'Đang tải media…',
    confirmDiscard: (fileName: string) =>
      `Xóa bản local ${fileName} trên Flight Controller?`,
    processing: 'Đang xử lý…',
    approveUpload: 'Upload ảnh',
    deleteLocal: 'Xóa bản local',
    discard: 'Discard',
    loadMediaFailed: 'Không tải được media trên Flight Controller',
    uploadFailed: 'Upload thất bại',
    deleteFailed: 'Không xóa được media',
  },
  en: {
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
