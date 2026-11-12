import { apiRequest } from '../../shared/api/httpClient'

export type RefundStatus =
  | 'REQUESTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
export type TransferOutcome = 'SUCCESSFUL' | 'FAILED'
export type RefundExecutionChannel = 'BANK_TRANSFER' | 'VNPAY_MERCHANT_PORTAL'

export type RefundAdminSummary = {
  successfulPaymentsTotal: number
  completedRefundsTotal: number
  pendingRefundsTotal: number
  pendingRefundCount: number
  outstandingMissionMilestonesTotal: number
  outstandingMissionMilestoneCount: number
}

export type RefundReceipt = {
  id: string
  fileName: string
  contentType: string
  byteSize: number
  uploadedAt: string | null
  accessPath: string
}

export type RefundTransferAttempt = {
  id: string
  attemptNumber: number
  executionChannel: RefundExecutionChannel
  beneficiaryBank: string | null
  beneficiaryName: string | null
  beneficiaryAccountNumber: string | null
  beneficiaryConfirmedWithCustomer: boolean
  amount: number
  transactionReference: string
  transferredAt: string
  note: string | null
  outcome: TransferOutcome
  failureReason: string | null
  recordedById: string
  recordedByName: string
  createdAt: string | null
  receipts: RefundReceipt[]
}

export type RefundResponse = {
  id: string
  orderId: string
  orderCode: string | null
  orderTitle: string
  customerId: string
  customerName: string
  customerEmail: string
  invoiceId: string
  invoiceNumber: string
  depositPayments: Array<{
    paymentId: string
    amount: number
    currency: string
    provider: string
    transactionReference: string | null
    paidAt: string | null
  }>
  reason: string
  status: RefundStatus
  requestedById: string
  requestedByName: string
  requestedAt: string
  processingAdminId: string | null
  processingAdminName: string | null
  processingAt: string | null
  completedById: string | null
  completedByName: string | null
  completedAt: string | null
  rejectedById: string | null
  rejectedByName: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  cancelledById: string | null
  cancelledByName: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  refundableAmount: number
  refundedAmount: number
  attempts: RefundTransferAttempt[]
}

export type RefundTransferAttemptInput = {
  executionChannel: RefundExecutionChannel
  beneficiaryBank?: string | null
  beneficiaryName?: string | null
  beneficiaryAccountNumber?: string | null
  beneficiaryConfirmedWithCustomer: boolean
  amount: number
  transactionReference: string
  transferredAt: string
  note?: string | null
  outcome: TransferOutcome
  failureReason?: string | null
}

export const refundApi = {
  requestForOrder: (orderId: string, reason: string) =>
    apiRequest<RefundResponse>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/deposit-refunds`,
      { method: 'POST', body: { reason } },
    ),
  getManagerOrderRefund: (orderId: string, signal?: AbortSignal) =>
    apiRequest<RefundResponse>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/deposit-refund`,
      { signal },
    ),
  getCustomerOrderRefund: (orderId: string, signal?: AbortSignal) =>
    apiRequest<RefundResponse>(
      `/api/orders/${encodeURIComponent(orderId)}/deposit-refund`,
      { signal },
    ),
  listAdmin: (status?: RefundStatus, signal?: AbortSignal) =>
    apiRequest<RefundResponse[]>('/api/admin/deposit-refunds', {
      query: { status },
      signal,
    }),
  getAdminSummary: (signal?: AbortSignal) =>
    apiRequest<RefundAdminSummary>('/api/admin/deposit-refunds/summary', { signal }),
  startProcessing: (refundId: string) =>
    apiRequest<RefundResponse>(
      `/api/admin/deposit-refunds/${encodeURIComponent(refundId)}/processing`,
      { method: 'POST' },
    ),
  reject: (refundId: string, reason: string) =>
    apiRequest<RefundResponse>(
      `/api/admin/deposit-refunds/${encodeURIComponent(refundId)}/reject`,
      { method: 'POST', body: { reason } },
    ),
  cancel: (refundId: string, reason: string) =>
    apiRequest<RefundResponse>(
      `/api/admin/deposit-refunds/${encodeURIComponent(refundId)}/cancel`,
      { method: 'POST', body: { reason } },
    ),
  recordAttempt: (refundId: string, body: RefundTransferAttemptInput) =>
    apiRequest<RefundResponse>(
      `/api/admin/deposit-refunds/${encodeURIComponent(refundId)}/attempts`,
      { method: 'POST', body },
    ),
  uploadReceipt: (refundId: string, attemptId: string, file: File) => {
    const body = new FormData()
    body.append('file', file)
    return apiRequest<RefundResponse>(
      `/api/admin/deposit-refunds/${encodeURIComponent(refundId)}/attempts/${encodeURIComponent(attemptId)}/receipts`,
      { method: 'POST', body },
    )
  },
  confirm: (refundId: string) =>
    apiRequest<RefundResponse>(
      `/api/admin/deposit-refunds/${encodeURIComponent(refundId)}/confirm`,
      { method: 'POST' },
    ),
  getReceiptAccess: (refundId: string, receiptId: string) =>
    apiRequest<{
      url: string
      contentType: string
      fileName: string
      expiresInSeconds: number
    }>(
      `/api/deposit-refunds/${encodeURIComponent(refundId)}/receipts/${encodeURIComponent(receiptId)}/access`,
    ),
}
