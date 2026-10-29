import { defineMessages } from '../../../../../shared/i18n'

export const managerMissionStopFlowMessages = defineMessages({
  vi: {
    releaseTitle: 'Giải phóng tài nguyên?',
    cancelTitle: 'Hủy nhiệm vụ?',
    releaseBody: (code: string) =>
      `Giải phóng thiết bị và nhân sự của ${code}.`,
    cancelBody: (code: string) => `Hủy ${code} và giữ lại lịch sử.`,
    releaseAction: 'Giải phóng tài nguyên',
    cancelAction: 'Hủy nhiệm vụ',
    recorded: 'Thao tác đã được ghi nhận.',
  },
  en: {
    releaseTitle: 'Release resources?',
    cancelTitle: 'Cancel Mission?',
    releaseBody: (code: string) => `Release the device and staff of ${code}.`,
    cancelBody: (code: string) => `Cancel ${code} and keep its history.`,
    releaseAction: 'Release resources',
    cancelAction: 'Cancel mission',
    recorded: 'The action has been recorded.',
  },
})
