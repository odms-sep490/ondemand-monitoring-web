import { defineMessages } from '../../../shared/i18n'

export const customerFinancePanelMessages = defineMessages({
  vi: {
    title: 'Báo giá và thanh toán',
    description: 'Giá được manager xác nhận theo phạm vi yêu cầu của đơn.',
    loading: 'Đang tải báo giá...',
    networkError: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
    paymentProviderError:
      'Không thể khởi tạo thanh toán VNPAY. Vui lòng kiểm tra cấu hình cổng thanh toán hoặc thử lại sau.',
    missingPaymentUrl: 'Cổng thanh toán chưa trả về đường dẫn thanh toán.',
    loadError: 'Không thể tải dữ liệu tài chính.',
    testPayment: 'Thanh toán nhanh (Test)',
    quoteVersion: (version: number) => `Báo giá v${version}`,
    apiErrors: {
      INVOICE_ALREADY_PAID: 'Hóa đơn này đã được thanh toán đầy đủ.',
      INVOICE_NOT_PAYABLE: 'Hóa đơn hiện không thể thanh toán.',
      DEPOSIT_ALREADY_SATISFIED: 'Khoản đặt cọc đã được thanh toán.',
      ACTIVE_PAYMENT_EXISTS: 'Đang có một giao dịch thanh toán chưa hoàn tất.',
      QUOTE_NOT_APPROVED: 'Báo giá chưa được phê duyệt.',
      QUOTE_NOT_CURRENT: 'Báo giá này không còn là phiên bản hiện hành.',
    } as Record<string, string>,
  },
  en: {
    title: 'Quote and payment',
    description: 'The manager confirms pricing based on the order scope.',
    loading: 'Loading quote…',
    networkError: 'Unable to reach the server. Please try again.',
    paymentProviderError:
      'Unable to start the VNPAY payment. Check the payment gateway configuration or try again later.',
    missingPaymentUrl: 'The payment gateway did not return a checkout URL.',
    loadError: 'Unable to load financial information.',
    testPayment: 'Quick payment (Test)',
    quoteVersion: (version: number) => `Quote v${version}`,
    apiErrors: {
      INVOICE_ALREADY_PAID: 'This invoice has already been paid in full.',
      INVOICE_NOT_PAYABLE: 'This invoice cannot be paid right now.',
      DEPOSIT_ALREADY_SATISFIED: 'The deposit has already been paid.',
      ACTIVE_PAYMENT_EXISTS: 'A payment is already in progress.',
      QUOTE_NOT_APPROVED: 'The quote has not been approved yet.',
      QUOTE_NOT_CURRENT: 'This quote is no longer the current version.',
    } as Record<string, string>,
  },
})
