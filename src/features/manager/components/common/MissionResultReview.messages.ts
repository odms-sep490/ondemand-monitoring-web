import { defineMessages } from '../../../../shared/i18n'

export const missionResultReviewMessages = defineMessages({
  vi: {
    statusLabels: {
      COMPLETED: 'Hoàn thành',
      DRAFT: 'Nháp',
      IN_PROGRESS: 'Đang thực hiện',
      FAILED: 'Không hoàn thành',
      CANCELLED: 'Đã hủy',
    },
    approvalLabels: {
      DRAFT: 'Nháp',
      PENDING_MANAGER_APPROVAL: 'Chờ Inspector nghiệm thu',
      APPROVED: 'Đã nghiệm thu',
      REJECTED: 'Đã từ chối',
    },
    missionStatusCaption: 'Tiến độ',
    approvalStatusCaption: 'Nghiệm thu',
    unknown: 'Chưa xác định',
    missionDone: 'Nhiệm vụ đã hoàn thành',
    missionNotDone: 'Nhiệm vụ chưa hoàn thành',
    checklistReady: 'Danh mục kiểm tra đủ điều kiện gửi kết quả',
    checklistNotReady: 'Danh mục kiểm tra chưa sẵn sàng',
    checklistUnconfirmed: 'Chưa xác nhận danh mục kiểm tra',
    hasMedia: 'Có ảnh/video',
    noMedia: 'Chưa có ảnh/video',
    mediaPending: 'Còn ảnh/video chưa được duyệt',
    heading: 'Kết quả nhiệm vụ',
    submittedAt: 'Gửi lúc',
    notSubmitted: 'Chưa gửi',
    duration: 'Thời lượng',
    notRecorded: 'Chưa ghi nhận',
    media: 'Ảnh/video',
    mediaCount: (n: number) => `${n} ảnh/video`,
    fullSummary: 'Chi tiết kết quả',
    noResult: 'Chưa có kết quả nhiệm vụ được gửi.',
    readinessAria: 'Điều kiện duyệt kết quả',
    readinessTitle: 'Tiến độ nghiệm thu',
    reviewMediaSeparately:
      'Inspector kiểm tra ảnh/video và công bố kết quả cho khách hàng.',
    viewMediaLibrary: 'Xem thư viện ảnh/video',
    rejectReason: 'Lý do từ chối',
    inspectorOwnership: 'Inspector phụ trách nghiệm thu',
    inspectorPublication:
      'Kết quả được công bố trực tiếp sau khi Inspector xác nhận. Manager xử lý phản hồi và yêu cầu làm lại của khách hàng.',
    // Actions
    draftNotice: 'Kết quả nháp — chưa được gửi để duyệt.',
    rejectedNotice:
      'Kết quả đã bị từ chối. Nhân sự thực hiện cần chỉnh sửa và gửi lại.',
    noteLabel: 'Ghi chú / lý do',
    noteHint: 'Cần khi từ chối, hoặc khi duyệt dù thiếu ảnh/video so với đơn',
    notePlaceholder:
      'Nhập lý do (ít nhất 10 ký tự) nếu từ chối hoặc duyệt khi còn thiếu ảnh/video…',
    checklistNotReadyToApprove:
      'Danh mục kiểm tra chưa sẵn sàng để duyệt kết quả.',
    rejectResult: 'Từ chối kết quả',
    approveResult: 'Duyệt kết quả',
  },
  en: {
    statusLabels: {
      COMPLETED: 'Completed',
      DRAFT: 'Draft',
      IN_PROGRESS: 'In progress',
      FAILED: 'Failed',
      CANCELLED: 'Cancelled',
    },
    approvalLabels: {
      DRAFT: 'Draft',
      PENDING_MANAGER_APPROVAL: 'Awaiting Inspector confirmation',
      APPROVED: 'Inspection confirmed',
      REJECTED: 'Rejected',
    },
    missionStatusCaption: 'Progress',
    approvalStatusCaption: 'Review',
    unknown: 'Unknown',
    missionDone: 'Mission completed',
    missionNotDone: 'Mission not completed',
    checklistReady: 'Checklist ready for submission',
    checklistNotReady: 'Checklist not ready',
    checklistUnconfirmed: 'Checklist not confirmed',
    hasMedia: 'Has media',
    noMedia: 'No media yet',
    mediaPending: 'Some media is not yet approved',
    heading: 'Mission result',
    submittedAt: 'Submitted at',
    notSubmitted: 'Not submitted',
    duration: 'Duration',
    notRecorded: 'Not recorded',
    media: 'Media',
    mediaCount: (n: number) => `${n} photos/videos`,
    fullSummary: 'Result details',
    noResult: 'No mission result has been submitted yet.',
    readinessAria: 'Result approval conditions',
    readinessTitle: 'Inspection progress',
    reviewMediaSeparately:
      'The Inspector reviews media and publishes results to the customer.',
    viewMediaLibrary: 'View media library',
    rejectReason: 'Rejection reason',
    inspectorOwnership: 'The Inspector owns result acceptance',
    inspectorPublication:
      'Results are published directly after Inspector confirmation. The Manager handles customer feedback and rework requests.',
    // Actions
    draftNotice: 'Draft result — not yet submitted for review.',
    rejectedNotice:
      'The result was rejected. The assigned staff must revise and resubmit it.',
    noteLabel: 'Note / reason',
    noteHint:
      'Required when rejecting, or when approving despite missing photos/videos versus the order',
    notePlaceholder:
      'Enter a reason (at least 10 characters) if rejecting or approving with missing media…',
    checklistNotReadyToApprove:
      'The checklist is not ready to approve the result.',
    rejectResult: 'Reject result',
    approveResult: 'Approve result',
  },
})
