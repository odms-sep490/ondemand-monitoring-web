import { defineMessages } from '../../../../shared/i18n'

export const uploadMediaPageMessages = defineMessages({
  vi: {
    stepTitle: 'Tải media lên',
    uploadPermissionNote:
      'Để tải ảnh lên, bạn cần là Pilot hoặc Inspector đã nhận nhiệm vụ. Bạn vẫn có thể xem media và cập nhật checklist nếu được phân công giám sát.',
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
    checkingPermissions: 'Đang xác nhận quyền tải lên…',
    permissionsUnavailable:
      'Không tải được quyền tải lên. Bấm Làm mới để thử lại.',
    enlargePreview: 'Xem ảnh lớn',
    closePreview: 'Đóng ảnh',
    openingMission: 'Đang mở mission',
    summaryNote:
      'Bản local vẫn được giữ trên Flight Controller đến khi bạn xóa.',
    mediaLoaded: 'media đã tải lên',
    uploadedChip: (n: number) => `${n} đã tải lên`,
    pendingChip: (n: number) => `${n} chờ tải lên`,
    uploadingChip: (n: number) => `${n} đang xử lý`,
    validatingChip: (n: number) => `${n} đang xác thực`,
    manualChip: (n: number) => `${n} cần tải thủ công`,
    mediaProgress: (uploaded: number, total: number) =>
      total ? `Đã tải lên ${uploaded} trên ${total} media` : 'Chưa có media',
    sendBlocked:
      'Hoàn tất checklist và tải đủ bằng chứng lên trước khi gửi Manager.',
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
    viewShort: 'Xem trước',
    openMediaPreview: (name: string) => `Xem trước ${name}`,
    moreActions: 'Thêm thao tác',
    attachToChecklist: 'Gắn vào checklist',
    attachSelected: (n: number) => `${n} mục`,
    fileTable: (n: number) => `Danh sách file (${n})`,
    emptyMedia: 'Chưa có media trên thiết bị.',
    emptyMediaHelp:
      'Kết nối Flight Controller hoặc tạo media trong Mission, rồi làm mới danh sách.',
    emptyFilteredMedia: 'Không có media phù hợp với bộ lọc này.',
    showAllMedia: 'Hiện tất cả',
    managerReviewPending: 'Media đã tải lên và đang chờ Manager duyệt.',
    managerApproved: 'Manager đã duyệt media này.',
    managerRejected: (reason?: string) =>
      reason
        ? `Manager đã từ chối media này: ${reason}`
        : 'Manager đã từ chối media này. Liên hệ Manager để biết thêm.',
    retryUpload: 'Tải lại',
    uploadingNow: 'Đang tải lên…',
    manualUpload: 'Tải thủ công từ bản gốc',
    batchUploadComplete:
      'Đã gửi các tệp chờ tải. Trạng thái được cập nhật từ máy chủ.',
    noPendingUploads: (references: number) =>
      references > 0
        ? `Tất cả media đã được lưu (${references} ảnh tham chiếu). Không còn tệp chờ tải.`
        : 'Không có tệp nào chờ tải lên.',
    backToCockpit: 'Quay lại buồng lái',
    backToResult: 'Quay lại kết quả',
    refresh: 'Làm mới',
    uploadAll: 'Tải tất cả lên',
    missingChecklistEvidence:
      'Checklist chưa đủ bằng chứng hợp lệ. Tải media lên trước khi gửi Manager.',
    viewOnly: 'Chỉ xem media',
    restoringMission: 'Đang khôi phục mission đang mở...',
    loadingMedia: 'Đang tải media…',
    confirmDiscard: (fileName: string) =>
      `Xóa bản local ${fileName} trên Flight Controller?`,
    processing: 'Đang xử lý…',
    approveUpload: 'Tải ảnh lên',
    deleteLocal: 'Xóa bản local',
    discard: 'Xóa media',
    loadMediaFailed: 'Không tải được media trên Flight Controller',
    uploadFailed: 'Tải lên thất bại',
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
    summaryNote:
      'The local copy stays on the Flight Controller until you delete it.',
    mediaLoaded: 'media uploaded',
    uploadedChip: (n: number) => `${n} uploaded`,
    pendingChip: (n: number) => `${n} waiting to upload`,
    uploadingChip: (n: number) => `${n} processing`,
    validatingChip: (n: number) => `${n} validating`,
    manualChip: (n: number) => `${n} need manual upload`,
    mediaProgress: (uploaded: number, total: number) =>
      total ? `${uploaded} of ${total} media uploaded` : 'No media yet',
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
    viewShort: 'Preview',
    openMediaPreview: (name: string) => `Preview ${name}`,
    moreActions: 'More actions',
    attachToChecklist: 'Attach to checklist',
    attachSelected: (n: number) => `${n} item(s)`,
    fileTable: (n: number) => `File list (${n})`,
    emptyMedia: 'No media on the device yet.',
    emptyMediaHelp:
      'Connect the Flight Controller or create media in the mission, then refresh the list.',
    emptyFilteredMedia: 'No media match this filter.',
    showAllMedia: 'Show all',
    managerReviewPending: 'Media uploaded and waiting for Manager review.',
    managerApproved: 'The Manager approved this media.',
    managerRejected: (reason?: string) =>
      reason
        ? `The Manager rejected this media: ${reason}`
        : 'The Manager rejected this media. Contact them for details.',
    retryUpload: 'Retry upload',
    uploadingNow: 'Uploading…',
    manualUpload: 'Upload manually from original',
    batchUploadComplete:
      'Pending files were sent. Status is updated by the server.',
    noPendingUploads: (references: number) =>
      references > 0
        ? `All media is saved (${references} reference images). No files are waiting to upload.`
        : 'No files are waiting to upload.',
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
    approveUpload: 'Upload image',
    deleteLocal: 'Delete local copy',
    discard: 'Delete media',
    loadMediaFailed: 'Could not load media from the Flight Controller',
    uploadFailed: 'Upload failed',
    deleteFailed: 'Could not delete the media',
  },
})
