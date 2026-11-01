import { defineMessages } from '../../shared/i18n'

export const deliveryProgressMessages = defineMessages({
  vi: {
    ariaLabel: 'Tiến trình bàn giao',
    steps: [
      { label: 'Kiểm tra kết quả', shortLabel: 'Kiểm tra' },
      { label: 'Khách hàng duyệt', shortLabel: 'Duyệt' },
      { label: 'Bàn giao dữ liệu', shortLabel: 'Bàn giao' },
    ],
    status: {
      PROCESSING: 'Đang xử lý kết quả',
      READY_FOR_MANAGER_REVIEW: 'Chờ quản lý kiểm tra',
      CUSTOMER_REVIEW: 'Chờ Khách hàng duyệt',
      REVISION_REQUESTED: 'Đang chỉnh sửa',
      FINAL_PAYMENT_PENDING: 'Đã chấp nhận kết quả',
      PAYMENT_CONFIRMED: 'Đã chấp nhận kết quả',
      READY_FOR_DELIVERY: 'Sẵn sàng bàn giao',
      DELIVERED: 'Đã bàn giao',
    },
  },
  en: {
    ariaLabel: 'Delivery progress',
    steps: [
      { label: 'Result check', shortLabel: 'Check' },
      { label: 'Customer approval', shortLabel: 'Approval' },
      { label: 'Data delivery', shortLabel: 'Delivery' },
    ],
    status: {
      PROCESSING: 'Processing results',
      READY_FOR_MANAGER_REVIEW: 'Awaiting Manager check',
      CUSTOMER_REVIEW: 'Awaiting Customer approval',
      REVISION_REQUESTED: 'Revising',
      FINAL_PAYMENT_PENDING: 'Results accepted',
      PAYMENT_CONFIRMED: 'Results accepted',
      READY_FOR_DELIVERY: 'Ready for delivery',
      DELIVERED: 'Delivered',
    },
  },
})
