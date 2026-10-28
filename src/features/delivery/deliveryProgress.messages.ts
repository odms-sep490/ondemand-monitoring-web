import { defineMessages } from '../../shared/i18n'

export const deliveryProgressMessages = defineMessages({
  vi: {
    ariaLabel: 'Tiến trình bàn giao',
    steps: [
      { label: 'Kiểm tra kết quả', shortLabel: 'Kiểm tra' },
      { label: 'Customer duyệt', shortLabel: 'Duyệt' },
      { label: 'Thanh toán cuối', shortLabel: 'Thanh toán' },
      { label: 'Bàn giao dữ liệu', shortLabel: 'Bàn giao' },
    ],
    status: {
      PROCESSING: 'Đang xử lý kết quả',
      READY_FOR_MANAGER_REVIEW: 'Chờ Manager kiểm tra',
      CUSTOMER_REVIEW: 'Chờ Customer duyệt',
      REVISION_REQUESTED: 'Đang chỉnh sửa',
      FINAL_PAYMENT_PENDING: 'Chờ thanh toán cuối',
      PAYMENT_CONFIRMED: 'Đã xác nhận thanh toán',
      READY_FOR_DELIVERY: 'Sẵn sàng bàn giao',
      DELIVERED: 'Đã bàn giao',
    },
  },
  en: {
    ariaLabel: 'Delivery progress',
    steps: [
      { label: 'Result check', shortLabel: 'Check' },
      { label: 'Customer approval', shortLabel: 'Approval' },
      { label: 'Final payment', shortLabel: 'Payment' },
      { label: 'Data delivery', shortLabel: 'Delivery' },
    ],
    status: {
      PROCESSING: 'Processing results',
      READY_FOR_MANAGER_REVIEW: 'Awaiting Manager check',
      CUSTOMER_REVIEW: 'Awaiting Customer approval',
      REVISION_REQUESTED: 'Revising',
      FINAL_PAYMENT_PENDING: 'Awaiting final payment',
      PAYMENT_CONFIRMED: 'Payment confirmed',
      READY_FOR_DELIVERY: 'Ready for delivery',
      DELIVERED: 'Delivered',
    },
  },
})
