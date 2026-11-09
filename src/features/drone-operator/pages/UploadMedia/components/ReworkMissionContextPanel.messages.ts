import { defineMessages } from '../../../../../shared/i18n'

export const reworkMissionContextMessages = defineMessages({
  vi: {
    title: (code: string) => `Nhiệm vụ thực hiện lại · ${code}`,
    description:
      'Ưu tiên xử lý đúng các ý kiến khách hàng bên dưới. Ảnh cũ chỉ dùng làm tham chiếu; nhiệm vụ này cần tạo bằng chứng mới theo yêu cầu ban đầu.',
    managerInstructions: 'Hướng dẫn bổ sung từ quản lý',
    originalGuidance: 'Yêu cầu thực hiện ban đầu',
    customerFeedback: 'Phản hồi cần xử lý',
    feedbackCount: (count: number) => `${count} phản hồi`,
    round: (number: number) => `Lần phản hồi ${number}`,
    reasons: {
      MISSING_EVIDENCE: 'Thiếu bằng chứng',
      POOR_QUALITY: 'Chất lượng chưa đạt',
      WRONG_LOCATION: 'Sai vị trí',
      REQUIREMENT_NOT_MET: 'Chưa đáp ứng yêu cầu',
      OTHER: 'Lý do khác',
    },
    viewEvidence: 'Xem ảnh',
    evidenceExpired: 'Ảnh đã hết thời hạn lưu trữ.',
    evidenceUnavailable: 'Ảnh tham chiếu hiện không khả dụng.',
    evidencePreviewPending: 'Bản xem trước đang được tạo.',
    loading: 'Đang tải yêu cầu thực hiện lại…',
    loadFailed: 'Không tải được yêu cầu và phản hồi cũ của khách hàng.',
    retry: 'Thử lại',
  },
  en: {
    title: (code: string) => `Rework mission · ${code}`,
    description:
      'Address the customer feedback below. Previous images are references only; this mission requires new evidence that meets the original requirements.',
    managerInstructions: 'Additional manager instructions',
    originalGuidance: 'Original requirements',
    customerFeedback: 'Feedback to address',
    feedbackCount: (count: number) =>
      `${count} feedback ${count === 1 ? 'entry' : 'entries'}`,
    round: (number: number) => `Feedback round ${number}`,
    reasons: {
      MISSING_EVIDENCE: 'Missing evidence',
      POOR_QUALITY: 'Insufficient quality',
      WRONG_LOCATION: 'Wrong location',
      REQUIREMENT_NOT_MET: 'Requirements not met',
      OTHER: 'Other',
    },
    viewEvidence: 'View image',
    evidenceExpired: 'The image retention period has expired.',
    evidenceUnavailable: 'The reference image is unavailable.',
    evidencePreviewPending: 'The preview is being prepared.',
    loading: 'Loading rework instructions…',
    loadFailed: 'Could not load the original request and customer feedback.',
    retry: 'Retry',
  },
})
