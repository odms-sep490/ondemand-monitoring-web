import type { ChecklistReviewStatus, PricingChecklistItem } from '../types'
import { ApiError } from '../../../shared/api/httpClient'

export const statuses: Array<{
  value: Exclude<ChecklistReviewStatus, 'PENDING'>
  label: string
}> = [
  { value: 'ADDITIONAL', label: 'Tính phí bổ sung' },
  { value: 'DUPLICATE', label: 'Trùng lặp' },
  { value: 'REJECTED', label: 'Từ chối' },
]

export type Draft = {
  packagePrice: string
  discountAmount: string
  adjustmentAmount: string
  managerNote: string
  adjustmentReason: string
  adjustmentType:
    'DISCOUNT' | 'PROMOTION' | 'COMPENSATION' | 'GOODWILL' | 'CORRECTION'
  approvalNote: string
  prices: Record<string, string>
}

export const emptyDraft: Draft = {
  packagePrice: '0',
  discountAmount: '0',
  adjustmentAmount: '0',
  managerNote: '',
  adjustmentReason: '',
  adjustmentType: 'CORRECTION',
  approvalNote: '',
  prices: {},
}

/** Same bounds the server enforces: the policy's maximum discount and markup on this item's system price. */
export function priceLimits(
  system: number,
  maxDiscountPercent: number | null | undefined,
  maxMarkupPercent: number | null | undefined,
) {
  if (system <= 0 || maxDiscountPercent == null || maxMarkupPercent == null)
    return null
  return {
    min: Math.ceil((system * (100 - maxDiscountPercent)) / 100),
    max: Math.floor((system * (100 + maxMarkupPercent)) / 100),
  }
}

export function amount(value: string | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isSafeInteger(parsed) ? parsed : 0
}

/**
 * What the pricing policy in force charges for this checklist now. The price stored on the item is only what it was when the
 * order was created, so the live calculation wins whenever it covers the item.
 */
export function liveSystemPrice(
  item: PricingChecklistItem,
  lines:
    Array<{ orderChecklistItemId?: string | null; amount: number }> | undefined,
) {
  const mine = (lines ?? []).filter(
    (line) => line.orderChecklistItemId === item.id,
  )
  if (mine.length === 0) return item.systemCalculatedPrice ?? 0
  return mine.reduce((sum, line) => sum + line.amount, 0)
}

export function approvedPrices(
  items: PricingChecklistItem[],
  draft: Draft,
  lines:
    Array<{ orderChecklistItemId?: string | null; amount: number }> | undefined,
) {
  return Object.fromEntries(
    items
      .filter(isManagerPriced)
      .map((item) => [
        item.id,
        draft.prices[item.id] == null
          ? (item.managerApprovedAmount ??
            item.managerQuotedPrice ??
            liveSystemPrice(item, lines))
          : amount(draft.prices[item.id]),
      ]),
  )
}

export function isManagerPriced(item: PricingChecklistItem) {
  return (
    item.sourceType !== 'SERVICE_TEMPLATE' &&
    item.reviewStatus !== 'REJECTED' &&
    item.reviewStatus !== 'DUPLICATE' &&
    (item.managerQuoteRequired || item.reviewStatus === 'ADDITIONAL')
  )
}

export const MIN_REASON_LENGTH = 10

export function digits(value: string) {
  return value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '') || '0'
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'CUSTOM_WORK_PRICING_INCOMPLETE') return error.message
    const messages: Record<string, string> = {
      ORDER_CHECKLIST_REVIEW_INVALID:
        'Danh sách yêu cầu chưa được xem xét đầy đủ. Hãy phân loại tất cả nội dung trước khi duyệt báo giá.',
      STALE_PRICING_POLICY:
        'Chính sách giá vừa được cập nhật. Giá trên màn hình đã được tải lại, vui lòng kiểm tra rồi duyệt lại.',
      STALE_PRICING_REVISION:
        'Báo giá đã được cập nhật ở nơi khác. Vui lòng tải lại dữ liệu.',
      PRICING_ADJUSTMENT_REASON_REQUIRED: `Lý do điều chỉnh giá cần ít nhất ${MIN_REASON_LENGTH} ký tự.`,
      PRICING_SELF_APPROVAL_NOT_ALLOWED:
        'Người đề xuất không thể tự phê duyệt điều chỉnh giá.',
      PRICING_OVERRIDE_EXCEEDS_LIMIT:
        error.message?.trim() || 'Mức điều chỉnh vượt quá giới hạn cho phép.',
      PRICE_BELOW_ALLOWED_MINIMUM:
        'Giá sau điều chỉnh thấp hơn mức giá sàn cho phép.',
      ZERO_PRICE_NOT_ALLOWED: 'Giá báo không được bằng 0.',
      QUOTE_HAS_UNAPPROVED_PRICING: 'Điều chỉnh giá chưa được phê duyệt.',
      QUOTE_NOT_CURRENT: 'Báo giá này không còn là phiên bản hiện hành.',
      CONCURRENT_UPDATE:
        'Dữ liệu vừa được cập nhật. Vui lòng tải lại và thử lại.',
    }
    const known = error.code ? messages[error.code] : undefined
    if (known) return known
    // Show what the server said (which criterion is missing, which amount is invalid) instead of a generic sentence.
    const detail = error.message?.trim()
    if (error.code === 'ORDER_REVIEW_INCOMPLETE')
      return `Đơn chưa đủ điều kiện duyệt${detail ? `: ${detail}` : '.'}`
    if (error.code === 'QUOTE_PRICING_INVALID')
      return `Dữ liệu giá không hợp lệ${detail ? `: ${detail}` : '.'}`
    return `Không thể xử lý yêu cầu định giá${
      detail ? `: ${detail}` : ''
    }${error.code ? ` (${error.code})` : ''}. Vui lòng thử lại.`
  }
  return error instanceof Error
    ? error.message
    : 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
}
