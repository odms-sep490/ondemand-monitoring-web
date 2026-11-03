import { defineMessages } from '../../../shared/i18n'

/** Labels for the enum values of a support ticket (status, category, priority, sender role). */
export const ticketLabelsMessages = defineMessages({
  vi: {
    revisionSubject: 'Yêu cầu chỉnh sửa kết quả',
    status: {
      OPEN: 'Mới mở',
      ASSIGNED: 'Đã phân công',
      IN_PROGRESS: 'Đang xử lý',
      WAITING_FOR_CUSTOMER: 'Chờ bạn phản hồi',
      WAITING_FOR_STAFF: 'Chờ đội hỗ trợ',
      RESOLVED: 'Đã giải quyết',
      CLOSED: 'Đã đóng',
      CANCELLED: 'Đã huỷ',
    },
    category: {
      ORDERS: 'Đơn hàng & Yêu cầu',
      MISSIONS: 'Nhiệm vụ bay & Lịch bay',
      RESULTS: 'Kết quả giám sát & Dữ liệu',
      MEDIA: 'Livestream & Telemetry',
      SCHEDULING: 'Lên lịch & Đổi lịch bay',
      ACCOUNT: 'Tài khoản & Quyền truy cập',
    },
    priority: { NORMAL: 'Bình thường', HIGH: 'Cao', URGENT: 'Khẩn cấp' },
    senderRole: {
      CUSTOMER: 'Khách hàng',
      STAFF: 'Nhân viên hỗ trợ',
      MANAGER: 'Quản lý',
      SYSTEM: 'Hệ thống',
    },
  },
  en: {
    revisionSubject: 'Result revision request',
    status: {
      OPEN: 'Open',
      ASSIGNED: 'Assigned',
      IN_PROGRESS: 'In progress',
      WAITING_FOR_CUSTOMER: 'Waiting for you',
      WAITING_FOR_STAFF: 'Waiting for support',
      RESOLVED: 'Resolved',
      CLOSED: 'Closed',
      CANCELLED: 'Cancelled',
    },
    category: {
      ORDERS: 'Orders & requests',
      MISSIONS: 'Flight missions & schedule',
      RESULTS: 'Monitoring results & data',
      MEDIA: 'Live stream & telemetry',
      SCHEDULING: 'Scheduling & rescheduling',
      ACCOUNT: 'Account & access',
    },
    priority: { NORMAL: 'Normal', HIGH: 'High', URGENT: 'Urgent' },
    senderRole: {
      CUSTOMER: 'Customer',
      STAFF: 'Support agent',
      MANAGER: 'Manager',
      SYSTEM: 'System',
    },
  },
})
