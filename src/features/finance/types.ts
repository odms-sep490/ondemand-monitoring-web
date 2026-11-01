import type { ChecklistGuidanceData } from '../../shared/components/ChecklistGuidance'

export type ChecklistGuidanceSnapshot = {
  schemaVersion: 1
  items: Array<
    ChecklistGuidanceData & {
      itemId: string
      checklistRevision: number
      guidanceVersion: number
    }
  >
}

export type ChecklistGuidanceRequest = {
  expectedChecklistRevision: number
  expectedGuidanceVersion: number
  description: string | null
  executionSteps: string[]
  inputRequirements: string[]
  expectedOutputs: string[]
  confirm: boolean
}

export type ChecklistReviewStatus =
  'PENDING' | 'INCLUDED' | 'ADDITIONAL' | 'DUPLICATE' | 'REJECTED'

export type PricingChecklistItem = ChecklistGuidanceData & {
  guidanceVersion?: number
  guidanceConfirmedVersion?: number | null
  guidanceReady?: boolean
  canEditGuidance?: boolean
  guidanceBlockedReason?: string | null
  id: string
  sourceChecklistId: string | null
  content: string
  displayOrder: number
  sourceType: 'SERVICE_TEMPLATE' | 'CUSTOMER_SELECTED' | 'CUSTOMER_CUSTOM'
  reviewStatus: ChecklistReviewStatus
  managerNote: string | null
  managerQuoteRequired: boolean
  managerQuotedPrice: number | null
  systemCalculatedPrice?: number | null
  managerPriceAdjustmentReason?: string | null
  managerApprovedAmount?: number | null
  finalAmount?: number | null
  priceDifferenceAmount?: number | null
  priceDifferencePercent?: number | null
  requestedImageCount?: number
  requestedVideoCount?: number
  difficultySnapshot?: 'BASIC' | 'MEDIUM' | 'HARD' | 'VERY_HARD'
  checklistRevision?: number
  required?: boolean
  sourceChecklistVersion?: number | null
}

export type PricingCategory =
  | 'PACKAGE'
  | 'DISTANCE'
  | 'AREA'
  | 'ALTITUDE'
  | 'CHECKLIST'
  | 'OUTPUT'
  | 'RESOURCE'
  | 'TERRAIN'
  | 'CONDITION'
  | 'PERMIT'
  | 'DISCOUNT'
  | 'MANAGER_ADJUSTMENT'

export type QuoteItem = {
  id: string
  orderChecklistItemId: string | null
  type: PricingCategory | 'INCLUDED' | 'ADDITIONAL' | 'ADJUSTMENT'
  description: string
  quantity: number
  unitPrice: number
  amount: number
  displayOrder: number
}

export type Quote = {
  id: string
  orderId: string
  version: number
  status:
    | 'DRAFT'
    | 'PENDING_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'ACCEPTED_BY_CUSTOMER'
    | 'EXPIRED'
    | 'SUPERSEDED'
  packagePrice: number
  additionalAmount: number
  discountAmount: number
  adjustmentAmount: number
  totalAmount: number
  managerNote: string | null
  approvedByName: string | null
  approvedAt: string | null
  acceptedAt: string | null
  checklistRevision?: number
  checklistGuidanceSnapshot?: ChecklistGuidanceSnapshot | null
  items: QuoteItem[]
  pricingPolicyId?: string
  pricingPolicyVersion?: number
  systemCalculatedAmount?: number
  managerAdjustmentAmount?: number
  adjustmentType?:
    'DISCOUNT' | 'PROMOTION' | 'COMPENSATION' | 'GOODWILL' | 'CORRECTION' | null
  adjustmentReason?: string | null
  adjustmentRequestedById?: string | null
  adjustmentRequestedByName?: string | null
  adjustmentRequestedAt?: string | null
  pricingApprovalStatus?:
    | 'NOT_REQUIRED'
    | 'PENDING_SECOND_MANAGER'
    | 'APPROVED'
    | 'REJECTED'
    | 'BLOCKED_BY_POLICY'
  pricingApprovedByName?: string | null
  pricingApprovedAt?: string | null
  pricingApprovalNote?: string | null
  pricingRevision?: number
  riskFlags?: Array<
    | 'ZERO_PRICE'
    | 'HIGH_DISCOUNT'
    | 'BELOW_MINIMUM_PRICE'
    | 'CUSTOM_WORK_OVERRIDE'
    | 'LARGE_MARKUP'
    | 'REPEATED_OVERRIDE'
  >
}

/** Customer-safe quote: no system amount, manager difference/reason, audit or risk flags. */
export type CustomerQuote = {
  id: string
  orderId: string
  version: number
  status: Quote['status']
  estimatedBaseAmount: number
  approvedAdditionalServiceAmount: number
  finalOrderAmount: number
  pricingFinalized: boolean
  approvedAt: string | null
  acceptedAt: string | null
  checklistRevision?: number
  checklistGuidanceSnapshot?: ChecklistGuidanceSnapshot | null
  items: QuoteItem[]
}

export type PricingBreakdownItem = {
  category: PricingCategory
  description: string
  quantity: number
  unitPrice: number
  amount: number
  orderChecklistItemId?: string | null
}

export type PricingBreakdown = {
  policyId: string
  policyVersion: number
  currency: string
  systemCalculatedAmount: number
  customWork: boolean
  assessmentComplete: boolean
  items: PricingBreakdownItem[]
}

export type Invoice = {
  id: string
  invoiceNumber: string
  orderId: string
  quoteId: string
  totalAmount: number
  depositAmount: number
  paidAmount: number
  remainingAmount: number
  status:
    'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'
  issuedAt: string
  finalPaymentAllowed: boolean
}

export type Payment = {
  id: string
  invoiceId: string
  paymentCode: number
  type: 'DEPOSIT' | 'FINAL_PAYMENT' | 'REFUND'
  amount: number
  currency: 'VND'
  status:
    'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  provider: 'VNPAY' | 'PAYOS'
  paymentUrl: string | null
  transactionReference: string
  providerTransactionId: string | null
  paidAt: string | null
}

export type PricingReview = {
  orderId: string
  orderCode: string | null
  customerName: string
  serviceName: string
  basePackagePrice: number
  checklistItems: PricingChecklistItem[]
  currentQuote: Quote | null
  quoteHistory: Quote[]
  systemCalculation?: PricingBreakdown
  currentManagerId?: string
  managerMaxDiscountPercent?: number | null
  managerMaxMarkupPercent?: number | null
  checklistRevision?: number
}
