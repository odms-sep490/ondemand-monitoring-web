import { defineMessages } from '../../../../../shared/i18n'

export const planningPaymentGateMessages = defineMessages({
  vi: {
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
