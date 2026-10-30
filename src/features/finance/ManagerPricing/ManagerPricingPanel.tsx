import { useEffect, useRef, useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useToast } from '../../../shared/components/ui'
import { useI18n } from '../../../shared/i18n'
import { financeApi } from '../api'
import { pricingFeedbackMessages } from './pricingFeedback.messages'
import { pricingMessages } from './pricing.messages'
import type { ChecklistReviewStatus, PricingChecklistItem } from '../types'
import '../finance.css'
import {
  type Draft,
  emptyDraft,
  liveSystemPrice,
  amount,
  approvedPrices,
  priceLimits,
  isManagerPriced,
  errorMessage,
  MIN_REASON_LENGTH,
} from './pricingHelpers'
import { ChecklistReview } from './components/ChecklistReview'
import { QuoteSummary } from './components/QuoteSummary'
import { PricingLoading } from './components/PricingLoading'
import { PricingLoadError } from './components/PricingLoadError'

export function ManagerPricingPanel({
  orderId,
  onApproved,
  onChecklistReviewChanged,
  approveBlockedReason,
}: {
  orderId: string
  onApproved?: () => void
  onChecklistReviewChanged?: () => void
  /** Why approving is not allowed yet (approval criteria not met); null/undefined = allowed. */
  approveBlockedReason?: string | null
}) {
  const query = useApiQuery(
    (signal) => financeApi.getPricingReview(orderId, signal),
    [orderId],
  )
  const { t: fb } = useI18n(pricingFeedbackMessages)
  const { t } = useI18n(pricingMessages)
  const toast = useToast()
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'reviewed' | 'additional'
  >('all')
  const [openNote, setOpenNote] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [approvalSucceeded, setApprovalSucceeded] = useState(false)
  const dirtyPriceIds = useRef(new Set<string>())
  const initializedQuoteKey = useRef<string | null>(null)

  useEffect(() => {
    setApprovalSucceeded(false)
    dirtyPriceIds.current.clear()
    initializedQuoteKey.current = null
    setDraft(emptyDraft)
  }, [orderId])

  useEffect(() => {
    const quote = query.data?.currentQuote
    if (!query.data) return
    const quoteKey = quote
      ? `${quote.id}:${quote.pricingRevision ?? quote.version}`
      : `new:${orderId}`
    setDraft((state) => {
      const prices = { ...state.prices }
      for (const item of query.data!.checklistItems) {
        if (item.sourceType === 'SERVICE_TEMPLATE') continue
        if (dirtyPriceIds.current.has(item.id)) continue
        prices[item.id] = String(
          item.managerApprovedAmount ??
            item.managerQuotedPrice ??
            liveSystemPrice(item, query.data!.systemCalculation?.items),
        )
      }
      const firstLoad = initializedQuoteKey.current !== quoteKey
      initializedQuoteKey.current = quoteKey
      if (!firstLoad) return { ...state, prices }
      return {
        ...state,
        packagePrice: String(
          quote?.packagePrice ??
            query.data!.systemCalculation?.systemCalculatedAmount ??
            query.data!.basePackagePrice,
        ),
        discountAmount: String(quote?.discountAmount ?? 0),
        adjustmentAmount: '0',
        managerNote: quote?.managerNote ?? '',
        adjustmentReason: quote?.adjustmentReason ?? '',
        adjustmentType: quote?.adjustmentType ?? 'CORRECTION',
        approvalNote: '',
        prices,
      }
    })
  }, [orderId, query.data])

  const pendingReviewCount = (query.data?.checklistItems ?? []).filter(
    (item) =>
      item.sourceType !== 'SERVICE_TEMPLATE' &&
      (!item.reviewStatus || item.reviewStatus === 'PENDING'),
  ).length
  const pendingCustomCount = (query.data?.checklistItems ?? []).filter(
    (item) =>
      (!item.reviewStatus || item.reviewStatus === 'PENDING') &&
      item.sourceType === 'CUSTOMER_CUSTOM',
  ).length
  const checklistCount = query.data?.checklistItems.length ?? 0
  const reviewedCount = checklistCount - pendingReviewCount
  const reviewComplete = pendingReviewCount === 0
  const systemPrice =
    query.data?.systemCalculation?.systemCalculatedAmount ??
    amount(draft.packagePrice)
  // Until the draft prices are initialised an item is at its own starting price, i.e. not adjusted.
  const startingPrices = approvedPrices(
    query.data?.checklistItems ?? [],
    draft,
    query.data?.systemCalculation?.items,
  )
  const priceRange = (system: number) =>
    priceLimits(
      system,
      query.data?.managerMaxDiscountPercent,
      query.data?.managerMaxMarkupPercent,
    )
  const outOfRangeCount = (query.data?.checklistItems ?? []).filter((item) => {
    if (!isManagerPriced(item)) return false
    const system = liveSystemPrice(item, query.data?.systemCalculation?.items)
    const range = priceRange(system)
    const price = startingPrices[item.id]
    return (
      range !== null &&
      price !== system &&
      (price < range.min || price > range.max)
    )
  }).length
  const checklistAdjustment = (query.data?.checklistItems ?? [])
    .filter(isManagerPriced)
    .reduce(
      (sum, item) =>
        sum +
        startingPrices[item.id] -
        liveSystemPrice(item, query.data?.systemCalculation?.items),
      0,
    )
  const total = systemPrice + checklistAdjustment

  async function updateReview(
    item: PricingChecklistItem,
    status: ChecklistReviewStatus,
    managerNote = item.managerNote ?? '',
  ) {
    setError(null)
    try {
      await financeApi.reviewChecklist(orderId, item.id, {
        status,
        managerNote: managerNote.trim() || null,
      })
      toast.success(fb.reviewSaved)
      query.reload()
      onChecklistReviewChanged?.()
    } catch (cause) {
      setError(errorMessage(cause))
      toast.error(errorMessage(cause))
    }
  }

  /** The backend wants a meaningful reason (at least 10 characters) whenever the total differs from the system price. */
  function reasonProblem() {
    const adjusted =
      checklistAdjustment !== 0 || amount(draft.adjustmentAmount) !== 0
    const length = draft.adjustmentReason.trim().length
    if (!adjusted || length >= MIN_REASON_LENGTH) return null
    return length === 0
      ? t.reasonMissing
      : t.reasonTooShort(MIN_REASON_LENGTH, length)
  }

  async function approve() {
    if (!query.data) return
    const problem = reasonProblem()
    if (problem) {
      setMessage(null)
      setError(problem)
      return
    }
    if (outOfRangeCount > 0) {
      setMessage(null)
      setError(t.outOfRange(outOfRangeCount))
      return
    }
    if (pendingCustomCount > 0) {
      setMessage(null)
      setError(t.pendingCustom(pendingCustomCount))
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const quote = await financeApi.saveDraft(orderId, {
        packagePrice: systemPrice,
        discountAmount: 0,
        adjustmentAmount: amount(draft.adjustmentAmount),
        managerNote: draft.managerNote.trim() || null,
        additionalUnitPrices: approvedPrices(
          query.data.checklistItems,
          draft,
          query.data.systemCalculation?.items,
        ),
        adjustmentReason: draft.adjustmentReason.trim() || null,
        adjustmentType: draft.adjustmentType,
        expectedPricingRevision:
          query.data.currentQuote?.pricingRevision ?? null,
        expectedPolicyVersion:
          query.data.systemCalculation?.policyVersion ?? null,
      })
      dirtyPriceIds.current.clear()
      await financeApi.approveQuote(orderId, quote.id)
      setApprovalSucceeded(true)
      onApproved?.()
      setMessage(t.approveSuccess)
      toast.success(fb.quoteApproved)
      query.reload()
    } catch (cause) {
      setError(errorMessage(cause))
      toast.error(errorMessage(cause))
      if (cause instanceof ApiError && cause.code === 'STALE_PRICING_POLICY') {
        // Show the Manager the prices that now apply; typed prices would be judged against the old ones.
        dirtyPriceIds.current.clear()
        query.reload()
      }
    } finally {
      setBusy(false)
    }
  }

  if (query.loading && !query.data) return <PricingLoading />
  if (!query.data) return <PricingLoadError query={query} />
  const approved =
    approvalSucceeded || query.data.currentQuote?.status === 'APPROVED'
  const accepted = query.data.currentQuote?.status === 'ACCEPTED_BY_CUSTOMER'
  const additionalCount = query.data.checklistItems.filter(
    (item) => item.reviewStatus === 'ADDITIONAL',
  ).length
  const filterLabels = [
    { key: 'all', label: t.filterAll, count: checklistCount },
    { key: 'pending', label: t.filterPending, count: pendingReviewCount },
    { key: 'reviewed', label: t.filterReviewed, count: reviewedCount },
    { key: 'additional', label: t.filterAdditional, count: additionalCount },
  ] as const
  const visibleItems = query.data.checklistItems.filter((item) =>
    filter === 'pending'
      ? item.sourceType !== 'SERVICE_TEMPLATE' &&
        item.reviewStatus === 'PENDING'
      : filter === 'reviewed'
        ? item.reviewStatus !== 'PENDING'
        : filter === 'additional'
          ? item.reviewStatus === 'ADDITIONAL'
          : true,
  )

  return (
    <div className="finance-workspace">
      <ChecklistReview
        reviewComplete={reviewComplete}
        reviewedCount={reviewedCount}
        checklistCount={checklistCount}
        filterLabels={filterLabels}
        filter={filter}
        setFilter={setFilter}
        visibleItems={visibleItems}
        accepted={accepted}
        updateReview={updateReview}
        draft={draft}
        setDraft={setDraft}
        dirtyPriceIds={dirtyPriceIds}
        priceRange={priceRange}
        openNote={openNote}
        setOpenNote={setOpenNote}
        data={query.data}
      />
      <div className="finance-sidebar">
        <QuoteSummary
          systemPrice={systemPrice}
          checklistAdjustment={checklistAdjustment}
          total={total}
          reviewComplete={reviewComplete}
          pendingReviewCount={pendingReviewCount}
          draft={draft}
          accepted={accepted}
          setDraft={setDraft}
          error={error}
          message={message}
          busy={busy}
          approved={approved}
          pendingCustomCount={pendingCustomCount}
          outOfRangeCount={outOfRangeCount}
          approveBlockedReason={approveBlockedReason}
          approve={approve}
          data={query.data}
        />
      </div>
    </div>
  )
}
