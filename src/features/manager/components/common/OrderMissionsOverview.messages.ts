import { defineMessages } from '../../../../shared/i18n'

export const orderMissionsOverviewMessages = defineMessages({
  vi: {
    title: 'Tổng quan nhiệm vụ',
    subtitle:
      'Kiểm tra lại lịch, nhân sự và thiết bị của toàn bộ nhiệm vụ trước khi hoàn tất.',
    reload: 'Làm mới',
    completeCount: (done: number, total: number) =>
      `${done}/${total} nhiệm vụ đã phân công đầy đủ`,
    ready: 'Sẵn sàng',
    missingAssignment: 'Còn thiếu phân công',
    loading: 'Đang tải nhiệm vụ…',
    assignedDevice: 'Thiết bị đã phân công',
    cancelled: 'Đã hủy',
    assigned: 'Đã phân công',
    schedule: 'Lịch',
    device: 'Thiết bị',
    assignMore: 'Phân công tiếp',
    hintPermit: 'Cập nhật giấy phép bay cho từng nhiệm vụ trước khi thực hiện.',
    hintAllReady: 'Tất cả nhiệm vụ đã đủ nhân sự và thiết bị.',
    hintMissing:
      'Hoàn tất phân công các nhiệm vụ còn thiếu để kết thúc kế hoạch.',
  },
  en: {
    title: 'Mission overview',
    subtitle:
      'Review the schedule, staff and devices of all Missions before finishing.',
    reload: 'Refresh',
    completeCount: (done: number, total: number) =>
      `${done}/${total} Missions fully assigned`,
    ready: 'Ready',
    missingAssignment: 'Assignments missing',
    loading: 'Loading missions…',
    assignedDevice: 'Assigned device',
    cancelled: 'Cancelled',
    assigned: 'Assigned',
    schedule: 'Schedule',
    device: 'Device',
    assignMore: 'Continue assigning',
    hintPermit:
      'Update the flight permit for each Mission before carrying it out.',
    hintAllReady: 'All Missions have enough staff and devices.',
    hintMissing:
      'Finish assigning the remaining Missions to complete the plan.',
  },
})
