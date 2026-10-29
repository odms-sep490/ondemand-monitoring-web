import { defineMessages } from '../../../../../shared/i18n'

export const notificationItemMessages = defineMessages({
  vi: {
    mediaAvailable: 'Có kết quả mới sẵn sàng',
    other: (type: string) => (type ? `Thông báo: ${type}` : 'Thông báo mới'),
    view: 'Xem kết quả',
  },
  en: {
    mediaAvailable: 'New results are ready',
    other: (type: string) =>
      type ? `Notification: ${type}` : 'New notification',
    view: 'View result',
  },
})
