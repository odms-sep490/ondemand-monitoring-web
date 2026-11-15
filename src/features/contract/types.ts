export type ContractStatus =
  | 'NOT_REQUIRED'
  | 'NOT_ISSUED'
  | 'AWAITING_SIGNATURE'
  | 'PENDING_VERIFICATION'
  | 'CHANGES_REQUESTED'
  | 'CONFIRMED'
  | 'CANCELLED'
export type ContractDocument = {
  fileName: string
  byteSize: number
  sha256: string
}
export type ContractSubmission = {
  id: string
  submissionNumber: number
  status: 'PENDING' | 'SUPERSEDED' | 'CHANGES_REQUESTED' | 'CONFIRMED'
  submittedAt: string
  submittedBy: string
  reviewedAt: string | null
  reviewedBy: string | null
  reviewNote: string | null
  document: ContractDocument
}
export type OrderContract = {
  required: boolean
  id: string | null
  version: number
  invoiceId: string | null
  quoteId: string
  quoteVersion: number
  contractNumber: string | null
  status: ContractStatus
  issuedAt: string | null
  issuedBy: string | null
  confirmedAt: string | null
  confirmedBy: string | null
  document: ContractDocument | null
  submissions: ContractSubmission[]
}

export type CancellationResponsibility = 'UNRESOLVED' | 'SYSTEM' | 'CUSTOMER'
export type ContractCancellation = {
  id: string
  version: number
  status:
    | 'REVIEW_REQUIRED'
    | 'REFUND_REQUESTED'
    | 'DEPOSIT_RETAINED'
    | 'NO_PAYMENT_DUE'
  responsibility: CancellationResponsibility
  reason: string
  basis: string | null
  depositPaid: number
  refundId: string | null
  requestedAt: string
  requestedBy: string
  decidedAt: string | null
  decidedBy: string | null
}
