import { defineMessages } from '../../../../shared/i18n'

export const missionHistoryPageMessages = defineMessages({
  vi: {
    title: 'Lịch sử lần bay',
    subtitle: 'Các lần bay đã kết thúc thuộc đơn hàng của bạn.',
    refresh: 'Làm mới',
    errorTitle: 'Không tải được lịch sử lần bay',
    emptyTitle: 'Chưa có lần bay nào',
    emptyDescription:
      'Lần bay đã hoàn thành, thất bại hoặc bị huỷ sẽ hiện ở đây.',
    unit: 'lần bay',
  },
  en: {
    title: 'Mission history',
    subtitle: 'Finished missions of your orders.',
    refresh: 'Refresh',
    errorTitle: 'Unable to load the mission history',
    emptyTitle: 'No missions yet',
    emptyDescription: 'Completed, failed or cancelled missions appear here.',
    unit: 'missions',
  },
})
