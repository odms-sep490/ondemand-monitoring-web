import { defineMessages } from '../../../../../shared/i18n'

export const planningMissionItemMessages = defineMessages({
  vi: {
    cancelMission: (code: string) => `Hủy nhiệm vụ ${code}`,
    cancelReason: (code: string) => `Lý do hủy ${code}`,
    confirmCancel: 'Xác nhận hủy nhiệm vụ',
    close: 'Đóng',
    createReplacement: (code: string) => `Tạo nhiệm vụ thay thế cho ${code}`,
  },
  en: {
    cancelMission: (code: string) => `Cancel Mission ${code}`,
    cancelReason: (code: string) => `Reason for cancelling ${code}`,
    confirmCancel: 'Confirm Mission cancellation',
    close: 'Close',
    createReplacement: (code: string) =>
      `Create replacement Mission for ${code}`,
  },
})
