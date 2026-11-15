export type ContractStatus =
  | 'NOT_REQUIRED'
  | 'NOT_ISSUED'
  | 'AWAITING_SIGNATURE'
  | 'PENDING_VERIFICATION'
  | 'CHANGES_REQUESTED'
  | 'CONFIRMED'
export type ContractDocument = {
  fileName: string
  byteSize: number
  sha256: string
}
export type ContractSubmission = {
  id: string
  submissionNumber: number
  status: 'PENDING' | 'CHANGES_REQUESTED' | 'CONFIRMED'
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
  invoiceId: string
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
