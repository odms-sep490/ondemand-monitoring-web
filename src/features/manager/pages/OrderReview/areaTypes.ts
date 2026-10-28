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

/**
 * The part of `GET /api/flight-area-assessment` the backend actually returns
 * (`FlightAreaAssessmentResponse`): the checked location and the Ministry of
 * Defence flight-ban comparison.
 */
export type MinistryFlightBan = {
  available: boolean
  totalAreaSquareMeters?: number | null
  violatedAreaSquareMeters?: number | null
  safeAreaSquareMeters?: number | null
  violatedZones: string[]
  sourceUrl: string
  errorCode?: string | null
}

export type ManagerAreaAssessment = {
  location: { latitude: number; longitude: number; radiusMeters: number }
  ministryFlightBan?: MinistryFlightBan
}
