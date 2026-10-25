export type CriterionResult = 'PASS' | 'WARN' | 'FAIL' | 'PENDING'

export type ReadinessRecommendation =
  | 'COMPLETE_REVIEW'
  | 'REQUEST_INFO_OR_REJECT'
  | 'APPROVE_WITH_NOTES'
  | 'APPROVE'

export type ReadinessCriterion = {
  code: string
  type: 'AUTO' | 'MANUAL'
  title: string
  description: string
  /** AUTO: a FAIL blocks approval. MANUAL: must be answered and not FAIL. */
  required: boolean
  result: CriterionResult
  /** System explanation (AUTO). */
  reason: string | null
  /** Manager remark (MANUAL). */
  note: string | null
  decidedByName: string | null
  decidedAt: string | null
}

export type OrderReadiness = {
  orderId: string
  criteria: ReadinessCriterion[]
  canApprove: boolean
  blockingReasons: string[]
  recommendation: ReadinessRecommendation
}
