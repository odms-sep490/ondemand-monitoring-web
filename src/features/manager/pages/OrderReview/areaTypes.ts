import type { LegalReviewStatus } from '../../types/orders'

export type SavedAreaReview = {
  status: LegalReviewStatus
  requestedScopeFeasible: boolean | null
  reason: string | null
  note: string | null
  reviewer: string | null
  reviewedAt: string | null
}

export type AreaReviewChoice = LegalReviewStatus | 'CHANGE_LOCATION'
