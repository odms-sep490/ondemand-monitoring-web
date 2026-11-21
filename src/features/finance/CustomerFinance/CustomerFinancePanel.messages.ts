import { defineMessages } from '../../../shared/i18n'

export const customerFinancePanelMessages = defineMessages({
  vi: {
    quoteTitle: 'Duyệt & báo giá',
    contractTitle: 'Hợp đồng',
    contractRequiredForPayment:
      'Chờ quản lý xác nhận hợp đồng trước khi thanh toán tiền cọc.',
    openContract: 'Xem hợp đồng',
    contractPending: 'Hợp đồng sẽ hiển thị sau khi bạn chấp nhận báo giá.',
    contractNotRequired: 'Đơn hàng này không yêu cầu hợp đồng.',
    paymentTitle: 'Thanh toán',
    paymentPending: 'Chưa có thông tin thanh toán',
    paymentDescription:
      'Chấp nhận báo giá, chờ quản lý xác nhận hợp đồng rồi thanh toán cọc. Nhiệm vụ chỉ được triển khai khi hợp đồng được xác nhận và đã đủ cọc.',
    title: 'Báo giá và thanh toán',
    description: 'Giá do quản lý xác nhận theo nội dung đơn hàng.',
    loading: 'Đang tải báo giá...',
    noFinancialData: 'Đơn hàng chưa có báo giá hoặc thông tin thanh toán.',
    noFinancialDataHint:
      'Quản lý sẽ gửi báo giá sau khi xem xét đơn. Bạn sẽ nhận thông báo khi báo giá sẵn sàng.',
    retry: 'Thử lại',
    networkError: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
    paymentProviderError:
      'Không thể khởi tạo thanh toán VNPAY. Vui lòng kiểm tra cấu hình cổng thanh toán hoặc thử lại sau.',
    missingPaymentUrl: 'Cổng thanh toán chưa trả về đường dẫn thanh toán.',
    loadError: 'Không thể tải dữ liệu tài chính.',
    testPayment: 'Thanh toán nhanh (Test)',
    testPaymentDisabled:
      'Backend đang tắt thanh toán test. Hãy chạy backend với profile demo.',
    testPaymentFailed: 'Thanh toán test thất bại',
    quoteVersion: (version: number) => `Báo giá v${version}`,
    apiErrors: {
      CONTRACT_NOT_CONFIRMED:
        'Hợp đồng cần được quản lý xác nhận trước khi thanh toán cọc.',
      INVOICE_ALREADY_PAID: 'Hóa đơn này đã được thanh toán đầy đủ.',
      INVOICE_NOT_PAYABLE: 'Hóa đơn hiện không thể thanh toán.',
      DEPOSIT_ALREADY_SATISFIED: 'Khoản đặt cọc đã được thanh toán.',
      ACTIVE_PAYMENT_EXISTS: 'Đang có một giao dịch thanh toán chưa hoàn tất.',
      QUOTE_NOT_APPROVED: 'Báo giá chưa được phê duyệt.',
      QUOTE_NOT_CURRENT: 'Báo giá này không còn là phiên bản hiện hành.',
    } as Record<string, string>,
  },
  en: {
    quoteTitle: 'Quote',
    contractTitle: 'Contract',
    contractRequiredForPayment:
      'Wait for manager confirmation of the contract before paying the deposit.',
    openContract: 'View contract',
    contractPending: 'The contract will appear after you accept the quote.',
    contractNotRequired: 'This order does not require a contract.',
    paymentTitle: 'Payment',
    paymentPending: 'No payment information yet',
    paymentDescription:
      'Accept the quote, submit the signed contract and pay the deposit. Mission deployment requires both contract confirmation and sufficient deposit.',
    title: 'Quote and payment',
    description: 'Pricing is confirmed for the items in this order.',
    loading: 'Loading quote…',
    noFinancialData: 'This order does not have a quote or payment record yet.',
    noFinancialDataHint:
      'The manager will send a quote after reviewing the order. You will be notified when it is ready.',
    retry: 'Try again',
    networkError: 'Unable to reach the server. Please try again.',
    paymentProviderError:
      'Unable to start the VNPAY payment. Check the payment gateway configuration or try again later.',
    missingPaymentUrl: 'The payment gateway did not return a checkout URL.',
    loadError: 'Unable to load financial information.',
    testPayment: 'Quick payment (Test)',
    testPaymentDisabled:
      'Test payments are disabled by the backend. Run the backend with the demo profile.',
    testPaymentFailed: 'Test payment failed',
    quoteVersion: (version: number) => `Quote v${version}`,
    apiErrors: {
      CONTRACT_NOT_CONFIRMED:
        'Wait for manager confirmation of the contract before paying the deposit.',
      INVOICE_ALREADY_PAID: 'This invoice has already been paid in full.',
      INVOICE_NOT_PAYABLE: 'This invoice cannot be paid right now.',
      DEPOSIT_ALREADY_SATISFIED: 'The deposit has already been paid.',
      ACTIVE_PAYMENT_EXISTS: 'A payment is already in progress.',
      QUOTE_NOT_APPROVED: 'The quote has not been approved yet.',
      QUOTE_NOT_CURRENT: 'This quote is no longer the current version.',
    } as Record<string, string>,
  },
})
