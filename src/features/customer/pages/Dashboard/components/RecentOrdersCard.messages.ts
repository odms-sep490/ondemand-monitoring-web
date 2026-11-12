import { defineMessages } from '../../../../../shared/i18n'

export const recentOrdersMessages = defineMessages({
  vi: {
    title: 'Đơn hàng gần đây',
    viewAll: 'Xem tất cả',
    emptyTitle: 'Chưa có đơn hàng nào',
    emptyDescription: 'Tạo yêu cầu giám sát đầu tiên của bạn.',
    emptyAction: 'Tạo yêu cầu đầu tiên',
    depositRequired: 'Cần thanh toán cọc',
    missionPaymentRequired: 'Có khoản thanh toán nhiệm vụ cần xử lý',
    columns: { order: 'Đơn hàng', date: 'Lịch mong muốn', status: 'Trạng thái' },
  },
  en: {
    title: 'Recent orders',
    viewAll: 'View all',
    emptyTitle: 'No orders yet',
    emptyDescription: 'Create your first monitoring request.',
    emptyAction: 'Create your first request',
    depositRequired: 'Deposit required',
    missionPaymentRequired: 'Mission payment needs attention',
    columns: { order: 'Order', date: 'Requested schedule', status: 'Status' },
  },
})
