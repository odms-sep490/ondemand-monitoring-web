import { defineMessages } from '../../../shared/i18n'

export const staffRequestQueuePageMessages = defineMessages({
  vi: {
    title: 'Hàng chờ yêu cầu',
    subtitle: 'Xem lại các yêu cầu giám sát mới gửi và duyệt để tạo nhiệm vụ.',
    pendingOrders: 'Đơn chờ duyệt',
    refresh: 'Làm mới',
    loadFailed: 'Không tải được danh sách đơn chờ duyệt',
    approveFailed: 'Duyệt đơn thất bại',
    loading: 'Đang tải các yêu cầu chờ duyệt...',
    noOrders: 'Không có đơn nào trong hàng chờ.',
    orderId: 'Mã đơn',
    orderTitle: 'Tiêu đề',
    customer: 'Khách hàng',
    preferredDate: 'Ngày mong muốn',
    location: 'Vị trí',
    actions: 'Thao tác',
    approve: 'Duyệt',
  },
  en: {
    title: 'Request queue',
    subtitle:
      'Review incoming monitoring requests and approve them to create missions.',
    pendingOrders: 'Pending Orders',
    refresh: 'Refresh',
    loadFailed: 'Failed to fetch pending orders',
    approveFailed: 'Approval failed',
    loading: 'Loading pending requests...',
    noOrders: 'No pending orders in the queue.',
    orderId: 'Order ID',
    orderTitle: 'Title',
    customer: 'Customer',
    preferredDate: 'Preferred Date',
    location: 'Location',
    actions: 'Actions',
    approve: 'Approve',
  },
})
