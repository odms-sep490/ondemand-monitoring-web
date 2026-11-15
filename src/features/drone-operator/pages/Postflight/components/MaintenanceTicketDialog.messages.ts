import { defineMessages } from '../../../../../shared/i18n'

export const maintenanceTicketDialogMessages = defineMessages({
  vi: {
    title: 'Tạo phiếu bảo trì',
    subtitle: 'Thông tin được điền sẵn từ kết quả kiểm tra sau bay.',
    deviceId: 'Mã thiết bị',
    missionId: 'Mã nhiệm vụ',
    issueType: 'Loại sự cố',
    severity: 'Mức độ ưu tiên',
    description: 'Mô tả',
    cancel: 'Hủy',
    submitting: 'Đang tạo...',
    submit: 'Tạo phiếu',
  },
  en: {
    title: 'Create maintenance ticket',
    subtitle: 'Prefilled from the postflight check.',
    deviceId: 'Device ID',
    missionId: 'Mission ID',
    issueType: 'Issue type',
    severity: 'Severity',
    description: 'Description',
    cancel: 'Cancel',
    submitting: 'Creating...',
    submit: 'Create ticket',
  },
})
