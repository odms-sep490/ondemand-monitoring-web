import { defineMessages } from '../../../shared/i18n'

export const checklistEvidencePanelMessages = defineMessages({
  vi: {
    remaining: (count: number) => `Còn thiếu ${count} bằng chứng hợp lệ`,
    imageOnly: 'Chỉ ảnh',
    videoOnly: 'Chỉ video',
    imageAndVideo: 'Ảnh và video',
    imageOrVideo: 'Ảnh hoặc video (cũ)',
    evidenceVideo: 'Video bằng chứng',
    evidenceImage: 'Ảnh bằng chứng',
    detachConfirm:
      'Gỡ bằng chứng khỏi mục này? Hệ thống chỉ dọn tệp trên S3 khi không còn được sử dụng và không thuộc hồ sơ nghiệm thu cần giữ.',
    ineligible:
      'Ảnh/video không phù hợp. Chọn đúng loại ảnh/video và nguồn bằng chứng được hỗ trợ.',
    updateFailed:
      'Không thể cập nhật bằng chứng. Vui lòng làm mới danh sách kiểm tra và thử lại.',
    unableDefault:
      'Quy trình ngoại lệ: Không thể xác minh được miễn đính kèm bằng chứng (bắt buộc phải có lý do giải trình).',
    assessmentOutOfSync:
      'Đánh giá đã được lưu nhưng danh sách kiểm tra chưa đồng bộ. Tải lại để cập nhật.',
    reload: 'Tải lại',
    evidence: 'Bằng chứng',
    remainingPrefix: 'Còn thiếu',
    validEvidenceSuffix: 'bằng chứng hợp lệ',
    image: 'Ảnh',
    notValidated: 'Chưa xác thực',
    awaitingReview: 'Chờ duyệt',
    rejected: 'Bị từ chối',
    moreActions: 'Thêm thao tác',
    detach: 'Gỡ bằng chứng',
    enough: '✓ Đã đủ bằng chứng',
    pickHint: 'Chọn ảnh/video của nhiệm vụ làm bằng chứng',
    addMedia: 'Thêm ảnh/video',
    validEvidence: 'Bằng chứng hợp lệ:',
    enoughValid: '✓ Đã đủ bằng chứng hợp lệ',
    unknownSource: 'Nguồn chưa xác định',
    operationallyReady: 'Đủ điều kiện vận hành',
    notEligible: 'Chưa hợp lệ',
    addEvidence: 'Thêm bằng chứng từ ảnh/video Nhiệm vụ',
    pick: 'Chọn ảnh/video làm bằng chứng',
    close: 'Đóng',
    searchLabel: 'Tìm ảnh/video',
    searchPlaceholder: 'Tìm theo tên tệp...',
    loading: 'Đang tải ảnh/video...',
    loadFailed: 'Không thể tải ảnh/video của Nhiệm vụ.',
    retry: 'Thử lại',
    noMatches: 'Không tìm thấy ảnh/video phù hợp.',
    emptyBeforeLink:
      'Nhiệm vụ này chưa có ảnh/video nào được tải lên lên hệ thống. Ảnh/video đang nằm trên thiết bị chỉ hiện ở màn hình nghiệm thu: hãy',
    openInspection: 'mở ảnh/video nghiệm thu',
    emptyAfterLink: 'để tải lên (hoặc gắn trực tiếp từ đó), rồi quay lại.',
    pageAttached:
      'Ảnh/video phù hợp ở trang này đã được gắn vào danh sách kiểm tra này.',
    allAttached:
      'Tất cả ảnh/video phù hợp đã được gắn vào danh sách kiểm tra này.',
    typeMismatchPrefix: 'Loại ảnh/video không phù hợp yêu cầu (',
    cannotAttach: 'Không thể gắn',
    attached: 'Đã gắn',
    attach: 'Gắn ảnh/video',
    previous: 'Trang trước',
    next: 'Trang sau',
    closePicker: 'Đóng chọn ảnh/video',
    unknownLegacy: 'Unknown/Legacy',
    video: 'Video',
    droneSource: 'Máy ảnh trên drone',
    satelliteSource: 'Ảnh vệ tinh',
    manualSource: 'Tải lên thủ công',
    view: 'Xem',
    reasons: {
      EVIDENCE_SOURCE_NOT_ELIGIBLE:
        'Nguồn ảnh/video không hợp lệ. Bằng chứng hỗ trợ máy ảnh trên drone và ảnh vệ tinh của hệ thống.',
      EVIDENCE_TYPE_NOT_ELIGIBLE:
        'Loại ảnh/video không phù hợp yêu cầu. Hãy chọn ảnh/video đúng loại.',
      MEDIA_REJECTED: 'Ảnh/video đã bị từ chối.',
      MEDIA_NOT_VALIDATED: 'Ảnh/video chưa xác thực thành công.',
      MEDIA_APPROVAL_REQUIRED: 'Cần duyệt ảnh/video trước khi duyệt kết quả.',
      INSUFFICIENT_EVIDENCE: 'Chưa đủ bằng chứng hợp lệ.',
      ASSESSMENT_REQUIRED:
        'Cần đánh giá mục danh sách kiểm tra trước khi gửi kết quả.',
      EXECUTION_NOT_COMPLETED:
        'Cần hoàn tất mục danh sách kiểm tra trước khi gửi kết quả.',
      EXECUTION_NOT_TERMINAL:
        'Cần chọn trạng thái cuối cùng cho mục danh sách kiểm tra trước khi gửi kết quả.',
      UNABLE_REASON_REQUIRED: 'Cần lý do không thể xác minh.',
      CHECKLIST_INTEGRITY_INVALID:
        'Danh sách kiểm tra không khớp bản chụp dữ liệu đơn hàng.',
    },
    sources: {
      DRONE_CAMERA: 'Máy ảnh trên drone',
      SATELLITE_SNAPSHOT: 'Ảnh vệ tinh',
      MANUAL_UPLOAD: 'Tải lên thủ công',
    },
    unableWithReason: (reason: string) =>
      `Quy trình ngoại lệ: Miễn nộp bằng chứng do không thể xác minh (Lý do: "${reason}").`,
    evidenceFor: (content: string) => `Bằng chứng: ${content}`,
    previewFile: (name: string) => `Xem trước ${name}`,
    page: (page: number) => `Trang ${page}`,
  },
  en: {
    remaining: (count: number) => `Missing ${count} valid evidence files`,
    imageOnly: 'Images only',
    videoOnly: 'Videos only',
    imageAndVideo: 'Images and videos',
    imageOrVideo: 'Images or videos (legacy)',
    evidenceVideo: 'Evidence video',
    evidenceImage: 'Evidence image',
    detachConfirm:
      'Remove this attachment? S3 cleanup only applies to unused draft files that are not retained in a result.',
    ineligible:
      'This file is not eligible. Select the required image/video type and a supported evidence source.',
    updateFailed:
      'Could not update evidence. Refresh the checklist and try again.',
    unableDefault:
      'Evidence is waived when verification is not possible; an explanation is required.',
    assessmentOutOfSync:
      'The assessment was saved, but the checklist is not synchronized. Reload to update it.',
    reload: 'Reload',
    evidence: 'Evidence',
    remainingPrefix: 'Missing',
    validEvidenceSuffix: 'valid evidence files',
    image: 'Image',
    notValidated: 'Not validated',
    awaitingReview: 'Awaiting review',
    rejected: 'Rejected',
    moreActions: 'More actions',
    detach: 'Remove evidence',
    enough: '✓ Enough evidence',
    pickHint: 'Select mission files as evidence',
    addMedia: 'Add media',
    validEvidence: 'Valid evidence:',
    enoughValid: '✓ Enough valid evidence',
    unknownSource: 'Unknown source',
    operationallyReady: 'Ready for execution',
    notEligible: 'Not eligible',
    addEvidence: 'Add evidence from mission media',
    pick: 'Select evidence files',
    close: 'Close',
    searchLabel: 'Search media',
    searchPlaceholder: 'Search file names...',
    loading: 'Loading media...',
    loadFailed: 'Could not load mission media.',
    retry: 'Retry',
    noMatches: 'No matching media found.',
    emptyBeforeLink:
      'This mission has no uploaded media yet. Files on the device are available in the inspection workspace:',
    openInspection: 'open inspection media',
    emptyAfterLink: 'upload or attach the files there, then return.',
    pageAttached:
      'Eligible files on this page are already attached to this checklist item.',
    allAttached:
      'All eligible files are already attached to this checklist item.',
    typeMismatchPrefix: 'The file type does not meet the requirement (',
    cannotAttach: 'Cannot attach',
    attached: 'Attached',
    attach: 'Attach media',
    previous: 'Previous page',
    next: 'Next page',
    closePicker: 'Close media picker',
    unknownLegacy: 'Unknown or legacy source',
    video: 'Video',
    droneSource: 'Drone camera',
    satelliteSource: 'Satellite image',
    manualSource: 'Manual upload',
    view: 'View',
    reasons: {
      EVIDENCE_SOURCE_NOT_ELIGIBLE:
        'Unsupported evidence source. Use a drone camera file or a supported system satellite image.',
      EVIDENCE_TYPE_NOT_ELIGIBLE:
        'The media type does not meet the requirement. Select the required images or videos.',
      MEDIA_REJECTED: 'This media was rejected.',
      MEDIA_NOT_VALIDATED: 'This media has not passed validation.',
      MEDIA_APPROVAL_REQUIRED:
        'Media must be approved before the result can be approved.',
      INSUFFICIENT_EVIDENCE: 'Not enough valid evidence.',
      ASSESSMENT_REQUIRED:
        'Assess this checklist item before submitting the result.',
      EXECUTION_NOT_COMPLETED:
        'Complete this checklist item before submitting the result.',
      EXECUTION_NOT_TERMINAL:
        'Choose a final status for this checklist item before submitting the result.',
      UNABLE_REASON_REQUIRED:
        'Provide a reason why verification is not possible.',
      CHECKLIST_INTEGRITY_INVALID:
        'The checklist does not match the order requirements.',
    },
    sources: {
      DRONE_CAMERA: 'Drone camera',
      SATELLITE_SNAPSHOT: 'Satellite image',
      MANUAL_UPLOAD: 'Manual upload',
    },
    unableWithReason: (reason: string) =>
      `Evidence is waived because verification is not possible (reason: "${reason}").`,
    evidenceFor: (content: string) => `Evidence: ${content}`,
    previewFile: (name: string) => `Preview ${name}`,
    page: (page: number) => `Page ${page}`,
  },
})
