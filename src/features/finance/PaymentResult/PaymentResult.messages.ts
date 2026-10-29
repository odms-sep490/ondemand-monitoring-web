import { defineMessages } from '../../../shared/i18n'

export const paymentResultMessages = defineMessages({
  vi: {
    missingReference: 'Không tìm thấy mã thanh toán trong URL trả về.',
    checkFailed: 'Không thể kiểm tra thanh toán.',
    retryFailed: 'Không thể tạo lại thanh toán.',
    titleSuccess: 'Thanh toán thành công',
    titleCancelled: 'Thanh toán đã hủy',
    titleChecking: 'Đang kiểm tra thanh toán',
    titlePending: 'Thanh toán đang được xác nhận',
    bodyDeposit:
      'Tiền đặt cọc đã được ghi nhận. Kế hoạch thực hiện đang được chuẩn bị.',
    bodyFinal: 'Thanh toán đã hoàn tất. Đang chờ quản lý bàn giao dữ liệu.',
    bodyCancelled: 'Chưa có khoản thu nào được xác nhận từ lần quay lại này.',
    bodyPending: 'Hệ thống đang xác minh trạng thái giao dịch với VNPAY.',
    reference: 'Mã thanh toán',
    amount: 'Số tiền',
    refresh: 'Làm mới trạng thái',
    retry: 'Thử lại',
    backToOrders: 'Về danh sách đơn',
  },
  en: {
    missingReference: 'No payment reference was found in the return URL.',
    checkFailed: 'Unable to check the payment.',
    retryFailed: 'Unable to create the payment again.',
    titleSuccess: 'Payment successful',
    titleCancelled: 'Payment cancelled',
    titleChecking: 'Checking your payment',
    titlePending: 'Payment is being confirmed',
    bodyDeposit:
      'Your deposit has been recorded. The execution plan is being prepared.',
    bodyFinal:
      'Payment is complete. Waiting for the manager to hand over the data.',
    bodyCancelled: 'No payment was confirmed from this return.',
    bodyPending: 'The system is verifying the transaction status with VNPAY.',
    reference: 'Payment reference',
    amount: 'Amount',
    refresh: 'Refresh status',
    retry: 'Try again',
    backToOrders: 'Back to orders',
  },
})
