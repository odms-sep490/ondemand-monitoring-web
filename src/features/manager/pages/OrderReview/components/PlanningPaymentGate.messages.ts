import { defineMessages } from '../../../../../shared/i18n'

export const planningPaymentGateMessages = defineMessages({
  vi: {
    waitingCustomer: 'Chờ khách hàng chấp nhận báo giá và ký hợp đồng',
    customerNote:
      'Báo giá và PDF hợp đồng đã được gửi cùng nhau. Khách hàng có thể xem và ký trong cùng luồng.',
    refreshStatus: 'Cập nhật trạng thái',
    waitingContract: 'Chờ xác nhận hợp đồng',
    contractNote:
      'Khách hàng có thể đặt cọc sau khi gửi bản ký. Chỉ mở kế hoạch khi hợp đồng được xác nhận và cọc đã đủ.',
    waiting: 'Đang chờ khách hàng thanh toán đặt cọc',
    checking: 'Đang kiểm tra…',
    checkPayment: 'Kiểm tra thanh toán',
    unlockNote:
      'Tạo nhiệm vụ và chốt kế hoạch sẽ được mở sau khi hệ thống xác nhận khoản đặt cọc.',
    paid: (paid: string, deposit: string) =>
      `Đã thanh toán ${paid} / ${deposit} ₫ tiền đặt cọc`,
    notAccepted:
      'Khách hàng chưa chấp nhận báo giá hoặc chưa phát hành hóa đơn.',
  },
  en: {
    waitingCustomer: 'Awaiting quote acceptance and signed contract',
    customerNote:
      'The quote and PDF contract were sent together. The customer can review and sign in the same flow.',
    refreshStatus: 'Refresh status',
    waitingContract: 'Awaiting contract verification',
    contractNote:
      'The customer may pay after submitting the signed contract. Planning requires both contract confirmation and sufficient deposit.',
    waiting: 'Waiting for the customer to pay the deposit',
    checking: 'Checking…',
    checkPayment: 'Check payment',
    unlockNote:
      'Creating Missions and finalizing the plan unlock once the system confirms the deposit.',
    paid: (paid: string, deposit: string) =>
      `Paid ${paid} / ${deposit} VND deposit`,
    notAccepted:
      'The customer has not accepted the quote or the invoice has not been issued yet.',
  },
})
