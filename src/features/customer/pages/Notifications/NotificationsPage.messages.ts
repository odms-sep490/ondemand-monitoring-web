import { defineMessages } from '../../../../shared/i18n'

export const notificationsPageMessages = defineMessages({
  vi: {
    title: 'Thông báo',
    subtitle: 'Thông báo khi có kết quả mới từ các lần bay của bạn.',
    refresh: 'Làm mới',
    errorTitle: 'Không tải được thông báo',
    emptyTitle: 'Chưa có thông báo',
    emptyDescription: 'Thông báo về kết quả lần bay sẽ xuất hiện ở đây.',
    unit: 'thông báo',
  },
  en: {
    title: 'Notifications',
    subtitle: 'Alerts when new results arrive from your missions.',
    refresh: 'Refresh',
    errorTitle: 'Unable to load notifications',
    emptyTitle: 'No notifications yet',
    emptyDescription:
      'Notifications about your mission results will appear here.',
    unit: 'notifications',
  },
})
