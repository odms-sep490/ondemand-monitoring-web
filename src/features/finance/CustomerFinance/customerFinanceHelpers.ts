import { ApiError } from '../../../shared/api/httpClient'
import { customerFinancePanelMessages } from './CustomerFinancePanel.messages'
import type { CustomerQuote } from '../types'
import { pricingDescription } from '../../../shared/lib/pricingPresentation'

export const invoiceStatusLabels: Record<string, string> = {
  ISSUED: 'Chờ thanh toán',
  PARTIALLY_PAID: 'Đã thanh toán một phần',
  PAID: 'Đã thanh toán',
  OVERDUE: 'Quá hạn',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
}

export function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404
}

export function messageOf(
  error: unknown,
  t: (typeof customerFinancePanelMessages)['vi'],
) {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') {
      return t.networkError
    }
    if (error.code === 'PAYMENT_PROVIDER_ERROR') {
      return 'Không thể khởi tạo thanh toán VNPAY. Vui lòng kiểm tra cấu hình cổng thanh toán hoặc thử lại sau.'
    }
    const messages: Record<string, string> = {
      INVOICE_ALREADY_PAID: 'Hóa đơn này đã được thanh toán đầy đủ.',
      INVOICE_NOT_PAYABLE: 'Hóa đơn hiện không thể thanh toán.',
      DEPOSIT_ALREADY_SATISFIED: 'Khoản đặt cọc đã được thanh toán.',
      ACTIVE_PAYMENT_EXISTS: 'Đang có một giao dịch thanh toán chưa hoàn tất.',
      QUOTE_NOT_APPROVED: 'Báo giá chưa được phê duyệt.',
      QUOTE_NOT_CURRENT: 'Báo giá này không còn là phiên bản hiện hành.',
    }
    if (error.code && messages[error.code]) {
      return messages[error.code]
    }
    return t.loadError
  }
  return error instanceof Error ? error.message : t.loadError
}

export const KIND_LABELS: Record<string, string> = {
  ADDITIONAL: 'Yêu cầu bổ sung',
  PACKAGE: 'Gói dịch vụ',
  MANAGER_ADJUSTMENT: 'Điều chỉnh đã được phê duyệt',
  DISCOUNT: 'Ưu đãi tự động',
}

export function lineText(
  row: CustomerQuote['items'][number],
  checklistName?: string,
) {
  if (row.type === 'MANAGER_ADJUSTMENT') {
    const reason = row.description.split(' · ').slice(1).join(' · ')
    return reason
      ? `${KIND_LABELS.MANAGER_ADJUSTMENT}: ${reason}`
      : KIND_LABELS.MANAGER_ADJUSTMENT
  }
  const text = pricingDescription(row.description)
  const prefix = checklistName ? `${checklistName} · ` : ''
  return prefix && text.startsWith(prefix) ? text.slice(prefix.length) : text
}
