import { defineMessages } from '../../../../../shared/i18n'

export const areaReviewDialogMessages = defineMessages({
  vi: {
    chooseResult: 'Chọn một kết quả đánh giá.',
    chooseReason: 'Chọn lý do khu vực không phù hợp.',
    saveFailed: 'Không thể lưu đánh giá. Vui lòng thử lại.',
    title: 'Đánh giá điều kiện khu vực bay',
    subtitle: 'Kết quả bản đồ cần được quản lý xác nhận trước khi tiếp tục.',
    close: 'Đóng',
    monitoringRequest: 'Yêu cầu giám sát',
    zonesToCheck: (n: number) => `${n} vùng cần đối chiếu`,
    reason: 'Lý do',
    selectReason: 'Chọn lý do',
    managerNote: 'Ghi chú của quản lý',
    notePlaceholder:
      'Ghi lại nội dung đã đối chiếu hoặc lưu ý cho bước tiếp theo…',
    cancel: 'Hủy',
    saving: 'Đang lưu…',
    confirm: 'Xác nhận đánh giá',
  },
  en: {
    chooseResult: 'Select a review result.',
    chooseReason: 'Select the reason the area is unsuitable.',
    saveFailed: 'Could not save the review. Please try again.',
    title: 'Review flight area conditions',
    subtitle:
      'The map result must be confirmed by a Manager before continuing.',
    close: 'Close',
    monitoringRequest: 'Monitoring request',
    zonesToCheck: (n: number) => `${n} zone(s) to check`,
    reason: 'Reason',
    selectReason: 'Select a reason',
    managerNote: 'Manager note',
    notePlaceholder: 'Record what you checked or notes for the next step…',
    cancel: 'Cancel',
    saving: 'Saving…',
    confirm: 'Confirm review',
  },
})
