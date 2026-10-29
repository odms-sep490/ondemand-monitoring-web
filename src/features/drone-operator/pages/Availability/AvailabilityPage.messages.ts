import { defineMessages } from '../../../../shared/i18n'

export const availabilityPageMessages = defineMessages({
  vi: {
    title: 'Lịch rảnh',
    description:
      'Khai báo khung giờ bạn có thể nhận nhiệm vụ trong tuần. Kéo trên lưới để chọn nhiều ô.',
    modeLabel: { AVAILABLE: 'Rảnh', BUSY: 'Bận', OFF: 'Nghỉ' },
    loadFailedTitle: 'Không tải được lịch rảnh',
    loadFailedDesc: 'Mất kết nối hoặc máy chủ đang bận.',
    retry: 'Thử lại',
    prevWeek: 'Tuần trước',
    nextWeek: 'Tuần sau',
    weekLabel: '21/09 – 27/09/2026 · Tuần 39',
    saving: 'Đang lưu...',
    saveChanges: 'Lưu thay đổi',
    savedBanner: 'Đã lưu lịch rảnh tuần 39',
    saveErrorBanner: 'Lưu thất bại. Vui lòng thử lại.',
    emptyWeekBanner: 'Chưa khai báo lịch rảnh cho tuần này.',
    declarePrefix: 'Khai báo:',
    selectionCount: (count: number) => `Kéo trên lưới... đang chọn ${count} ô`,
    deselect: 'Bỏ chọn',
    apply: 'Áp dụng',
    overlayLabels: [
      '0139-1 Đã nhận',
      '0152-1 Chờ phản hồi',
      '0154-1 Chờ phản hồi',
    ],
  },
  en: {
    title: 'Availability',
    description:
      'Declare the time slots you can take missions this week. Drag on the grid to select several cells.',
    modeLabel: { AVAILABLE: 'Available', BUSY: 'Busy', OFF: 'Off' },
    loadFailedTitle: 'Could not load availability',
    loadFailedDesc: 'Connection lost or the server is busy.',
    retry: 'Retry',
    prevWeek: 'Previous week',
    nextWeek: 'Next week',
    weekLabel: 'Sep 21 – Sep 27, 2026 · Week 39',
    saving: 'Saving...',
    saveChanges: 'Save changes',
    savedBanner: 'Week 39 availability saved',
    saveErrorBanner: 'Save failed. Please try again.',
    emptyWeekBanner: 'No availability declared for this week yet.',
    declarePrefix: 'Set:',
    selectionCount: (count: number) =>
      `Drag on the grid... ${count} cells selected`,
    deselect: 'Deselect',
    apply: 'Apply',
    overlayLabels: [
      '0139-1 Accepted',
      '0152-1 Awaiting reply',
      '0154-1 Awaiting reply',
    ],
  },
})
