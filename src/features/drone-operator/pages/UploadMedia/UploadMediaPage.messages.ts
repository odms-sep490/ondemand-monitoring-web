import { defineMessages } from '../../../../shared/i18n'

export const uploadMediaPageMessages = defineMessages({
  vi: {
    stepTitle: 'Tải media lên',
    approveEvidence: 'Duyệt bằng chứng',
    evidenceApproved: 'Đã duyệt bằng chứng.',
    reviewFailed: 'Không duyệt được bằng chứng.',
    localUnavailable:
      'File chưa có trên S3 và không còn bản local. Cần khôi phục bản sao hợp lệ trước khi gắn.',
    checklistTitle: 'Checklist thực hiện',
    mediaTitle: 'Danh sách media',
    workspaceNav: 'Bằng chứng của mission',
    missingChecklistItem: 'Mục checklist không còn thuộc mission này.',
    autoAttachHint:
      'Chọn “Gắn vào checklist” trên ảnh/video. Hệ thống tự tải và gắn bằng chứng sau khi xác nhận.',
    mediaLibraryFailed: 'Không tải được thư viện media. ',
    transferDetails: 'Chi tiết upload và khôi phục',
    queueHint:
      'File chưa xác thực không tính là đủ bằng chứng. Tác vụ được khôi phục khi mở lại; hãy thử lại để tiếp tục.',
    retryTask: 'Thử lại',
    hideTask: 'Ẩn tác vụ',
    previousPage: 'Trang trước',
    nextPage: 'Trang sau',
    queueSummary: (done: number, total: number, failed: number) =>
      `Tác vụ bằng chứng: ${done}/${total}${failed ? ` · ${failed} cần xử lý` : ''}`,
    queueStages: {
      QUEUED: 'Đang chờ',
      PREPARING: 'Đang chuẩn bị',
      ATTACHING: 'Đang gắn checklist',
      TRANSFERRING: 'Đang tải file',
      VALIDATING: 'Đang chờ xác thực',
      FAILED: 'Cần thử lại',
      DONE: 'Đã chuyển file; kiểm tra trạng thái xác thực trong checklist',
    } as Record<string, string>,
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
    summary: (
      uploaded: number,
      total: number,
      uploading: number,
      manual: number,
    ) =>
      `${uploaded}/${total} file đã lên${uploading ? ` · ${uploading} đang lên` : ''}${manual ? ` · ${manual} cần xử lý thủ công` : ''}`,
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
    refresh: 'Làm mới',
    uploadAll: 'Tải tất cả lên',
    missingChecklistEvidence:
      'Checklist chưa đủ bằng chứng hợp lệ. Tải media lên trước khi gửi Manager.',
    viewOnly: 'Chỉ xem media',
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
    stepTitle: 'Upload media',
    approveEvidence: 'Approve evidence',
    evidenceApproved: 'Evidence approved.',
    reviewFailed: 'Could not approve evidence.',
    localUnavailable:
      'The file is not uploaded and its local copy is unavailable. Restore a valid backup before attaching.',
    checklistTitle: 'Mission checklist',
    mediaTitle: 'Mission media',
    workspaceNav: 'Mission evidence',
    missingChecklistItem:
      'This checklist item no longer belongs to the mission.',
    autoAttachHint:
      'Choose “Attach to checklist” on an image or video. Upload and attachment start after you confirm.',
    mediaLibraryFailed: 'Could not load the media library. ',
    transferDetails: 'Upload details and recovery',
    queueHint:
      'Unvalidated files do not count as ready evidence. Recovered tasks need an explicit retry to continue.',
    retryTask: 'Retry',
    hideTask: 'Hide task',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    queueSummary: (done: number, total: number, failed: number) =>
      `Evidence tasks: ${done}/${total}${failed ? ` · ${failed} need attention` : ''}`,
    queueStages: {
      QUEUED: 'Queued',
      PREPARING: 'Preparing',
      ATTACHING: 'Attaching',
      TRANSFERRING: 'Uploading',
      VALIDATING: 'Waiting for validation',
      FAILED: 'Retry required',
      DONE: 'File transferred; check validation in the checklist',
    } as Record<string, string>,
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
    openingMission: 'Opening mission',
    summary: (
      uploaded: number,
      total: number,
      uploading: number,
      manual: number,
    ) =>
      `${uploaded}/${total} uploaded${uploading ? ` · ${uploading} uploading` : ''}${manual ? ` · ${manual} manual required` : ''}`,
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
    refresh: 'Refresh',
    uploadAll: 'Upload all',
    missingChecklistEvidence:
      'Checklist lacks valid evidence. Upload media before sending to the Manager.',
    viewOnly: 'View only',
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
