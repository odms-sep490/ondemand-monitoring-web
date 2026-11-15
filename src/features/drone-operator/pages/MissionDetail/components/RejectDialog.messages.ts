import { defineMessages } from '../../../../../shared/i18n'

export const rejectDialogMessages = defineMessages({
  vi: {
    title: 'Từ chối nhiệm vụ',
    description:
      'Vui lòng cho biết lý do để Manager có thể điều phối lại nhiệm vụ.',
    missionCodeLabel: 'Mã nhiệm vụ',
    missionCodeUnavailable: 'Chưa có mã nhiệm vụ',
    reasonLabel: 'Vì sao bạn không thể nhận nhiệm vụ?',
    reasons: [
      'Không thể tham gia vào thời gian được phân công',
      'Sức khỏe hoặc việc đột xuất',
      'Lý do khác',
    ],
    notesLabel: 'Ghi chú (tuỳ chọn)',
    notesPlaceholder: 'Bổ sung thông tin để Manager sắp xếp nhân sự thay thế...',
    cancel: 'Huỷ',
    submitting: 'Đang gửi...',
    submit: 'Xác nhận từ chối',
  },
  en: {
    title: 'Decline mission',
    description: 'Please tell us why so the Manager can reassign the mission.',
    missionCodeLabel: 'Mission code',
    missionCodeUnavailable: 'Mission code unavailable',
    reasonLabel: 'Why can’t you accept this mission?',
    reasons: [
      'Unavailable at the assigned time',
      'Health issue or unexpected personal matter',
      'Other reason',
    ],
    notesLabel: 'Notes (optional)',
    notesPlaceholder: 'Add details to help the Manager arrange a replacement...',
    cancel: 'Cancel',
    submitting: 'Submitting...',
    submit: 'Confirm rejection',
  },
})
