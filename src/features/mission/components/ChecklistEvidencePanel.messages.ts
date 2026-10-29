import { defineMessages } from '../../../shared/i18n'

export const evidencePanelMessages = defineMessages({
  vi: {
    reasons: {
      EVIDENCE_SOURCE_NOT_ELIGIBLE:
        'Nguồn media không hợp lệ. Bằng chứng hỗ trợ camera drone và ảnh vệ tinh của hệ thống.',
      EVIDENCE_TYPE_NOT_ELIGIBLE:
        'Loại media không phù hợp yêu cầu. Hãy chọn ảnh/video đúng loại.',
      MEDIA_REJECTED: 'Media đã bị từ chối.',
      MEDIA_NOT_VALIDATED: 'Media chưa xác thực thành công.',
      MEDIA_APPROVAL_REQUIRED: 'Cần duyệt media trước khi duyệt kết quả.',
      INSUFFICIENT_EVIDENCE: 'Chưa đủ bằng chứng hợp lệ.',
      EXECUTION_NOT_COMPLETED:
        'Mục checklist phải được đánh dấu hoàn thành trước khi chấp nhận nhiệm vụ.',
      EXECUTION_NOT_TERMINAL: 'Mục checklist chưa kết thúc.',
      UNABLE_REASON_REQUIRED: 'Cần lý do không thể xác minh.',
      CHECKLIST_INTEGRITY_INVALID: 'Checklist không khớp bản ghi của đơn hàng.',
    },
    evidenceType: {
      IMAGE: 'Chỉ ảnh',
      VIDEO: 'Chỉ video',
      IMAGE_AND_VIDEO: 'Ảnh và video',
      LEGACY: 'Ảnh hoặc video (cũ)',
    },
    sources: {
      DRONE_CAMERA: 'Camera drone',
      SATELLITE_SNAPSHOT: 'Ảnh vệ tinh',
      MANUAL_UPLOAD: 'Tải lên thủ công',
    },
    mediaStatuses: {
      PENDING_MANAGER_APPROVAL: 'Chờ quản lý duyệt',
      AVAILABLE: 'Đã duyệt',
      VALIDATING: 'Đang xác thực',
      UPLOADING: 'Đang tải lên',
      UPLOAD_PENDING: 'Chờ tải lên',
      RETRY_REQUIRED: 'Cần tải lên lại',
      MANUAL_UPLOAD_REQUIRED: 'Chờ tải lên thủ công',
      REJECTED: 'Bị từ chối',
    },
    notEligibleMedia:
      'Media không phù hợp. Chọn đúng loại ảnh/video và nguồn bằng chứng được hỗ trợ.',
    updateFailed:
      'Không thể cập nhật bằng chứng. Vui lòng làm mới checklist và thử lại.',
    unableWithReason: (reason: string) =>
      `Quy trình ngoại lệ: Miễn nộp bằng chứng do không thể xác minh (lý do: "${reason}").`,
    unableNoReason:
      'Quy trình ngoại lệ: mục không thể xác minh được miễn đính kèm bằng chứng (bắt buộc phải có lý do giải trình).',
    evidenceHead: (type: string) => `Bằng chứng · ${type}`,
    missing: (n: number) => `Còn thiếu ${n} bằng chứng hợp lệ`,
    typeVideo: 'Video',
    typeImage: 'Ảnh',
    legacy: 'Cũ',
    unknownLegacy: 'Không rõ / cũ',
    view: 'Xem',
    moreActions: 'Thêm thao tác',
    detach: 'Gỡ bằng chứng',
    enough: 'Đã đủ bằng chứng',
    enoughValid: 'Đã đủ bằng chứng hợp lệ',
    pickTitle: 'Chọn media của nhiệm vụ làm bằng chứng',
    addMedia: '+ Thêm media',
    sectionAria: (content: string) => `Bằng chứng: ${content}`,
    validCount: (have: number, need: number, type: string) =>
      `Bằng chứng hợp lệ: ${have} / ${need} · ${type}`,
    unknownSource: 'Nguồn chưa xác định',
    unknownStatus: 'Chưa rõ trạng thái',
    operational: 'Đủ điều kiện vận hành',
    invalid: 'Chưa hợp lệ',
    addFromMission: 'Thêm bằng chứng từ media của nhiệm vụ',
    dialogAria: 'Chọn media làm bằng chứng',
    dialogTitle: 'Chọn media làm bằng chứng',
    pageOf: (content: string, page: number) => `${content} · Trang ${page}`,
    close: 'Đóng',
    searchAria: 'Tìm media',
    searchPlaceholder: 'Tìm theo tên file...',
    loadingMedia: 'Đang tải media...',
    loadMediaFailed: 'Không thể tải media của nhiệm vụ.',
    retry: 'Thử lại',
    noMatch: 'Không tìm thấy media phù hợp.',
    emptyBefore:
      'Nhiệm vụ này chưa có media nào được tải lên hệ thống. Ảnh/video đang nằm trên thiết bị chỉ hiện ở màn hình nghiệm thu: hãy ',
    emptyLink: 'mở media nghiệm thu',
    emptyAfter: ' để tải lên (hoặc gắn trực tiếp từ đó), rồi quay lại.',
    allAttachedPage: 'Media phù hợp ở trang này đã được gắn vào checklist này.',
    allAttached: 'Tất cả media phù hợp đã được gắn vào checklist này.',
    viewVideo: (name: string) => `Xem video ${name}`,
    preview: (name: string) => `Xem trước ${name}`,
    wrongType: (type: string) => `Loại media không phù hợp yêu cầu (${type}).`,
    cannotAttach: 'Không thể gắn',
    attached: 'Đã gắn',
    attach: 'Gắn media',
    prev: 'Trang trước',
    next: 'Trang sau',
    closePicker: 'Đóng chọn media',
  },
  en: {
    reasons: {
      EVIDENCE_SOURCE_NOT_ELIGIBLE:
        'Invalid file source. Evidence supports drone camera files and system satellite imagery.',
      EVIDENCE_TYPE_NOT_ELIGIBLE:
        'The file type does not match the requirement. Choose the correct photo or video type.',
      MEDIA_REJECTED: 'The file was rejected.',
      MEDIA_NOT_VALIDATED: 'The file has not been validated successfully.',
      MEDIA_APPROVAL_REQUIRED:
        'The file must be approved before the result is reviewed.',
      INSUFFICIENT_EVIDENCE: 'Not enough valid evidence.',
      EXECUTION_NOT_COMPLETED:
        'The checklist item must be marked completed before the mission is accepted.',
      EXECUTION_NOT_TERMINAL: 'The checklist item is not finished.',
      UNABLE_REASON_REQUIRED: 'A reason it cannot be verified is required.',
      CHECKLIST_INTEGRITY_INVALID:
        'The checklist does not match the order record.',
    },
    evidenceType: {
      IMAGE: 'Photos only',
      VIDEO: 'Videos only',
      IMAGE_AND_VIDEO: 'Photos and videos',
      LEGACY: 'Photo or video (legacy)',
    },
    sources: {
      DRONE_CAMERA: 'Drone camera',
      SATELLITE_SNAPSHOT: 'Satellite image',
      MANUAL_UPLOAD: 'Manual upload',
    },
    mediaStatuses: {
      PENDING_MANAGER_APPROVAL: 'Awaiting manager approval',
      AVAILABLE: 'Approved',
      VALIDATING: 'Validating',
      UPLOADING: 'Uploading',
      UPLOAD_PENDING: 'Upload pending',
      RETRY_REQUIRED: 'Upload again',
      MANUAL_UPLOAD_REQUIRED: 'Manual upload pending',
      REJECTED: 'Rejected',
    },
    notEligibleMedia:
      'The file does not fit. Choose the correct photo or video type and a supported evidence source.',
    updateFailed:
      'Unable to update the evidence. Refresh the checklist and try again.',
    unableWithReason: (reason: string) =>
      `Exception: evidence is waived because the item cannot be verified (reason: "${reason}").`,
    unableNoReason:
      'Exception: an item that cannot be verified is exempt from attaching evidence (a written reason is required).',
    evidenceHead: (type: string) => `Evidence · ${type}`,
    missing: (n: number) => `${n} valid evidence files missing`,
    typeVideo: 'Video',
    typeImage: 'Photo',
    legacy: 'Legacy',
    unknownLegacy: 'Unknown / legacy',
    view: 'View',
    moreActions: 'More actions',
    detach: 'Remove evidence',
    enough: 'Evidence complete',
    enoughValid: 'Valid evidence complete',
    pickTitle: 'Choose mission files as evidence',
    addMedia: '+ Add files',
    sectionAria: (content: string) => `Evidence: ${content}`,
    validCount: (have: number, need: number, type: string) =>
      `Valid evidence: ${have} / ${need} · ${type}`,
    unknownSource: 'Unknown source',
    unknownStatus: 'Unknown status',
    operational: 'Eligible for operations',
    invalid: 'Not valid',
    addFromMission: 'Add evidence from mission files',
    dialogAria: 'Choose files as evidence',
    dialogTitle: 'Choose files as evidence',
    pageOf: (content: string, page: number) => `${content} · Page ${page}`,
    close: 'Close',
    searchAria: 'Search files',
    searchPlaceholder: 'Search by file name...',
    loadingMedia: 'Loading files...',
    loadMediaFailed: 'Unable to load the mission files.',
    retry: 'Try again',
    noMatch: 'No matching files found.',
    emptyBefore:
      'This mission has no files uploaded to the system yet. Photos and videos still on the device only appear on the acceptance screen: ',
    emptyLink: 'open the acceptance screen',
    emptyAfter:
      ' to upload them (or attach them directly there), then come back.',
    allAttachedPage:
      'Matching files on this page are already attached to this checklist item.',
    allAttached:
      'All matching files are already attached to this checklist item.',
    viewVideo: (name: string) => `View video ${name}`,
    preview: (name: string) => `Preview of ${name}`,
    wrongType: (type: string) =>
      `File type does not match the requirement (${type}).`,
    cannotAttach: 'Cannot attach',
    attached: 'Attached',
    attach: 'Attach file',
    prev: 'Previous page',
    next: 'Next page',
    closePicker: 'Close file picker',
  },
})
