import { apiRequest } from '../../shared/api/httpClient'
import type {
  ChecklistReviewStatus,
  ChecklistGuidanceRequest,
  Invoice,
  Payment,
  PricingChecklistItem,
  PricingReview,
  Quote,
  CustomerQuote,
} from './types'

export const financeApi = {
  getPricingReview: (orderId: string, signal?: AbortSignal) =>
    apiRequest<PricingReview>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/pricing`,
      { signal },
    ),
  reviewChecklist: (
    orderId: string,
    itemId: string,
    body: {
      status: ChecklistReviewStatus
      managerNote: string | null
      expectedChecklistRevision?: number | null
    },
  ) =>
    apiRequest<PricingChecklistItem>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/checklist-items/${encodeURIComponent(itemId)}`,
      { method: 'PATCH', body },
    ),
  saveChecklistGuidance: (
    orderId: string,
    itemId: string,
    body: ChecklistGuidanceRequest,
  ) =>
    apiRequest<PricingChecklistItem>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/checklist-items/${encodeURIComponent(itemId)}/guidance`,
      { method: 'PUT', body },
    ),
  saveDraft: (
    orderId: string,
    body: {
      packagePrice: number
      discountAmount: number
      adjustmentAmount: number
      managerNote: string | null
      additionalUnitPrices: Record<string, number>
      adjustmentReason?: string | null
      adjustmentType?:
        'DISCOUNT' | 'PROMOTION' | 'COMPENSATION' | 'GOODWILL' | 'CORRECTION'
      expectedPricingRevision?: number | null
      expectedPolicyVersion?: number | null
      expectedChecklistRevision?: number | null
    },
  ) =>
    apiRequest<Quote>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/quotes/draft`,
      {
        method: 'PUT',
        body,
      },
    ),
  approveQuote: (orderId: string, quoteId: string) =>
    apiRequest<Quote>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/quotes/${encodeURIComponent(quoteId)}/approve`,
      { method: 'POST' },
    ),
  getQuote: (orderId: string, signal?: AbortSignal) =>
    apiRequest<CustomerQuote>(
      `/api/orders/${encodeURIComponent(orderId)}/quote`,
      {
        signal,
      },
    ),
  acceptQuote: (orderId: string, quoteId: string) =>
    apiRequest<Invoice>(
      `/api/orders/${encodeURIComponent(orderId)}/quotes/${encodeURIComponent(quoteId)}/accept`,
      { method: 'POST' },
    ),
  getInvoice: (orderId: string, signal?: AbortSignal) =>
    apiRequest<Invoice>(`/api/orders/${encodeURIComponent(orderId)}/invoice`, {
      signal,
    }),
  /** Re-checks the order's pending VNPAY payments with VNPAY itself and returns the current invoice. */
  refreshOrderPayments: (orderId: string) =>
    apiRequest<Invoice>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/payments/refresh`,
      { method: 'POST' },
    ),
  getManagerInvoice: (orderId: string, signal?: AbortSignal) =>
    apiRequest<Invoice>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/invoice`,
      { signal },
    ),
  createDeposit: (invoiceId: string) =>
    apiRequest<Payment>(
      `/api/invoices/${encodeURIComponent(invoiceId)}/payments/deposit`,
      {
        method: 'POST',
      },
    ),
  completeTestDeposit: (invoiceId: string) =>
    apiRequest<Payment>(
      `/api/invoices/${encodeURIComponent(invoiceId)}/payments/test-deposit`,
      { method: 'POST' },
    ),
  createFinalPayment: (invoiceId: string) =>
    apiRequest<Payment>(
      `/api/invoices/${encodeURIComponent(invoiceId)}/payments/final`,
      {
        method: 'POST',
      },
    ),
  completeTestFinal: (invoiceId: string) =>
    apiRequest<Payment>(
      `/api/invoices/${encodeURIComponent(invoiceId)}/payments/test-final`,
      { method: 'POST' },
    ),
  getPaymentByReference: (transactionReference: string, signal?: AbortSignal) =>
    apiRequest<Payment>(
      `/api/payments/by-reference/${encodeURIComponent(transactionReference)}`,
      { signal },
    ),
  refreshPaymentByReference: (transactionReference: string) =>
    apiRequest<Payment>(
      `/api/payments/by-reference/${encodeURIComponent(transactionReference)}/refresh`,
      { method: 'POST' },
    ),
}
