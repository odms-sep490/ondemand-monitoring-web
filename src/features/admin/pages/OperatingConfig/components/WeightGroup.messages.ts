import { defineMessages } from '../../../../../shared/i18n'

export const weightGroupMessages = defineMessages({
  vi: {
    groupTitle: (label: string, group: string) =>
      `Trọng số ${label} (${group})`,
    droneGroup: 'Thiết bị bay',
    pilotGroup: 'Phi công',
    sumInvalid: (sum: number) =>
      `Tổng trọng số phải bằng 100%, hiện tại: ${sum}%.`,
    genericError: 'Lỗi khi lưu trọng số.',
    total: (sum: number, isValid: boolean) =>
      `Tổng: ${sum}%${isValid ? ' (hợp lệ)' : ' (phải bằng 100%)'}`,
    resetDefault: 'Đặt lại mặc định',
    saving: 'Đang lưu...',
    save: 'Lưu thay đổi',
  },
  en: {
    groupTitle: (label: string, group: string) => `${label} weights (${group})`,
    droneGroup: 'Drone',
    pilotGroup: 'Pilot',
    sumInvalid: (sum: number) =>
      `Total weight must equal 100%, currently: ${sum}%.`,
    genericError: 'Failed to save the weights.',
    total: (sum: number, isValid: boolean) =>
      `Total: ${sum}%${isValid ? ' (valid)' : ' (must equal 100%)'}`,
    resetDefault: 'Reset to default',
    saving: 'Saving...',
    save: 'Save changes',
  },
})
