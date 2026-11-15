import { guidanceMessages } from './guidance.messages'
import type { ChecklistReviewStatus, PricingChecklistItem } from '../types'
import { ApiError } from '../../../shared/api/httpClient'
import { getLanguage } from '../../../shared/i18n'
import { pricingMessages } from './pricing.messages'

export const statuses: Array<{
  value: Exclude<ChecklistReviewStatus, 'PENDING'>
  label: string
}> = [
  {
    value: 'ADDITIONAL',
    get label() {
      return pricingMessages[getLanguage()].statusAdditional
    },
  },
  {
    value: 'DUPLICATE',
    get label() {
      return pricingMessages[getLanguage()].statusDuplicate
    },
  },
  {
    value: 'REJECTED',
    get label() {
      return pricingMessages[getLanguage()].statusRejected
    },
  },
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
  priceReasons: Record<string, string>
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
  priceReasons: {},
}

export const VND_ROUNDING_UNIT = 1_000

export function roundPriceToNearestThousand(value: number) {
  return Math.floor((value + VND_ROUNDING_UNIT / 2) / VND_ROUNDING_UNIT) * VND_ROUNDING_UNIT
}

/** Rounded prices that remain inside the policy's suggested bounds. */
export function priceLimits(
  system: number,
  maxDiscountPercent: number | null | undefined,
  maxMarkupPercent: number | null | undefined,
) {
  if (system <= 0 || maxDiscountPercent == null || maxMarkupPercent == null)
    return null
  const rawMin = Math.ceil((system * (100 - maxDiscountPercent)) / 100)
  const rawMax = Math.floor((system * (100 + maxMarkupPercent)) / 100)
  return {
    min: Math.ceil(rawMin / VND_ROUNDING_UNIT) * VND_ROUNDING_UNIT,
    max: Math.floor(rawMax / VND_ROUNDING_UNIT) * VND_ROUNDING_UNIT,
  }
}

export function isOutsidePriceRange(
  proposed: number,
  system: number,
  range: { min: number; max: number } | null,
) {
  return (
    range !== null &&
    proposed !== system &&
    (proposed < range.min || proposed > range.max)
  )
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

/** Use a newly calculated system price when the saved approval merely mirrored its older system price. */
export function initialManagerPrice(item: PricingChecklistItem, currentSystemPrice: number) {
  const savedPrice = item.managerApprovedAmount ?? item.managerQuotedPrice
  if (savedPrice == null) return currentSystemPrice
  if (
    item.systemCalculatedPrice != null &&
    savedPrice === item.systemCalculatedPrice
  ) {
    return currentSystemPrice
  }
  return savedPrice
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
          ? initialManagerPrice(item, liveSystemPrice(item, lines))
          : amount(draft.prices[item.id]),
      ]),
  )
}

export function isManagerPriced(item: PricingChecklistItem) {
  // New catalog snapshots already carry the Admin-configured area-scaled price.
  if (item.pricingSnapshotVersion != null && item.pricingSnapshotVersion >= 2 && item.sourceChecklistId) {
    return false
  }
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
  const t = pricingMessages[getLanguage()]
  if (error instanceof ApiError) {
    if (error.code === 'CUSTOM_WORK_PRICING_INCOMPLETE') return error.message
    const guidance = guidanceMessages[getLanguage()]
    const messages: Record<string, string> = {
      CHECKLIST_GUIDANCE_EDIT_BLOCKED: guidance.blocked,
      CHECKLIST_GUIDANCE_INVALID: guidance.invalid,
      CHECKLIST_GUIDANCE_INCOMPLETE: guidance.pending,
      STALE_GUIDANCE_VERSION: guidance.conflict,
      STALE_GUIDANCE_SNAPSHOT: guidance.quoteStale,
      QUOTE_GUIDANCE_SNAPSHOT_STALE: guidance.quoteStale,
      CHECKLIST_GUIDANCE_SNAPSHOT_STALE: guidance.quoteStale,
      ORDER_CHECKLIST_REVIEW_INVALID: t.errReviewInvalid,
      STALE_PRICING_POLICY: t.errStalePolicy,
      STALE_PRICING_REVISION: t.errStaleRevision,
      PRICING_ADJUSTMENT_REASON_REQUIRED:
        t.errReasonRequired(MIN_REASON_LENGTH),
      PRICING_SELF_APPROVAL_NOT_ALLOWED: t.errSelfApproval,
      PRICING_OVERRIDE_EXCEEDS_LIMIT:
        error.message?.trim() || t.errOverrideExceeds,
      PRICE_BELOW_ALLOWED_MINIMUM: t.errBelowMinimum,
      ZERO_PRICE_NOT_ALLOWED: t.errZeroPrice,
      QUOTE_HAS_UNAPPROVED_PRICING: t.errUnapprovedPricing,
      QUOTE_NOT_CURRENT: t.errQuoteNotCurrent,
      CONCURRENT_UPDATE: t.errConcurrent,
    }
    const known = error.code ? messages[error.code] : undefined
    if (known) return known
    // Show what the server said (which criterion is missing, which amount is invalid) instead of a generic sentence.
    const detail = error.message?.trim()
    if (error.code === 'ORDER_REVIEW_INCOMPLETE')
      return t.errReviewIncomplete(detail ?? '')
    if (error.code === 'QUOTE_PRICING_INVALID')
      return t.errPricingInvalid(detail ?? '')
    return t.errGeneric(detail ?? '', error.code ?? '')
  }
  return error instanceof Error ? error.message : t.errFallback
}
