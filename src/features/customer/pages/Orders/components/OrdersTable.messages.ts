import { defineMessages } from '../../../../../shared/i18n'

export const ordersTableMessages = defineMessages({
  vi: {
    columns: {
      order: 'Đơn hàng',
      location: 'Địa điểm',
      schedule: 'Lịch mong muốn',
      service: 'Dịch vụ',
      status: 'Trạng thái',
      actions: 'Thao tác',
    },
    view: 'Xem chi tiết',
    addInformation: 'Bổ sung ngay',
    paymentRequired: 'Cần xác nhận & thanh toán',
    depositPaid: 'Đã thanh toán cọc',
  },
  en: {
    columns: {
      order: 'Order',
      location: 'Location',
      schedule: 'Preferred schedule',
      service: 'Service',
      status: 'Status',
      actions: 'Actions',
    },
    view: 'View details',
    addInformation: 'Add information',
    paymentRequired: 'Confirmation & payment required',
    depositPaid: 'Deposit paid',
  },
})
