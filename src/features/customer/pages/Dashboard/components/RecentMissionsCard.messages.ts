import { defineMessages } from '../../../../../shared/i18n'

export const recentMissionsMessages = defineMessages({
  vi: {
    title: 'Nhiệm vụ gần đây',
    viewAll: 'Xem lịch sử',
    empty: 'Chưa có nhiệm vụ nào hoàn tất.',
    errorTitle: 'Không tải được nhiệm vụ gần đây',
    retry: 'Thử lại',
    loading: 'Đang tải...',
    columns: { mission: 'Nhiệm vụ', time: 'Thời gian', status: 'Trạng thái' },
  },
  en: {
    title: 'Recent missions',
    viewAll: 'View history',
    empty: 'No finished missions yet.',
    errorTitle: 'Unable to load recent missions',
    retry: 'Retry',
    loading: 'Loading...',
    columns: { mission: 'Mission', time: 'Time', status: 'Status' },
  },
})
