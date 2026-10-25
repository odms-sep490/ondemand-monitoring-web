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
  },
})
