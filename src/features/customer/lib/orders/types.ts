import type { OrderStatus } from '../../../../shared/types/domain'
import type { ChecklistSnapshot } from '../checklist/types'

/** One row of `GET /api/orders/mine`, flattened for the list and dashboard. */
export type OrderRow = {
  id: string
  /** Short display code derived from the (uuid) id. */
  code: string
  title: string
  address: string | null
  dateFrom: string | null
  dateTo: string | null
  timeId: string | null
  timeName: string | null
  serviceId: string | null
  serviceName: string | null
  status: OrderStatus
  radiusM: number | null
  createdAt: string | null
  /** Customer-facing finance state, loaded separately for approved orders. */
  depositState?: 'ACTION_REQUIRED' | 'PAID'
}

export type DeliverableView = {
  id: string
  name: string
  format: string | null
  /** Scalar requirement entries (key, display value) worth showing. */
  requirements: Array<{ key: string; value: string }>
}

export type OrderTimelineEvent = {
  kind: 'created' | 'approved' | 'rejected' | 'status'
  at: string
  status?: OrderStatus
  actor: string | null
  note: string | null
}

/** Steps of the order progress stepper; the first four are the happy path. */
export type OrderStepKey =
  | 'submitted'
  | 'approved'
  | 'quote'
  | 'deposit'
  | 'planning'
  | 'inProgress'
  | 'completed'
  | 'rejected'
  | 'cancelled'

export type OrderStepState =
  'done' | 'current' | 'upcoming' | 'failed' | 'cancelled'

export type OrderStep = {
  key: OrderStepKey
  state: OrderStepState
  /** Only ever copied from a timeline event; null when the BE gave no date. */
  at: string | null
  actor: string | null
  note: string | null
}

/** `GET /api/orders/{id}` mapped for the detail page. */
export type OrderDetailView = OrderRow & {
  legalReviewStatus:
    'NOT_REVIEWED' | 'NOT_REQUIRED' | 'PENDING_PERMIT' | 'APPROVED' | 'REJECTED'
  checklistItems?: ChecklistSnapshot[]
  checklistSnapshotAt?: string | null
  checklistRevision: number
  canEditChecklist: boolean
  checklistEditBlockedReason: string | null
  coverageArea: Record<string, unknown> | null
  description: string | null
  usagePurpose: string | null
  flightPurpose: string | null
  altitudeM: number | null
  estimatedLengthM: number | null
  siteContactName: string | null
  siteContactPhone: string | null
  accessNotes: string | null
  monitoringRelationship:
    | 'OWNER'
    | 'AUTHORIZED_PERSON'
    | 'CONTRACTOR'
    | 'MANAGER_OR_SUPERVISOR'
    | 'OTHER'
    | null
  monitoringAuthorizationConfirmed: boolean
  monitoringAuthorizationDocuments: Array<{
    id: string
    documentName: string
    fileName: string
    notes?: string
  }>
  permitStatus: string | null
  permitNumber: string | null
  permitExpiresOn: string | null
  permitDocuments: Array<{ id: string; fileName: string }>
  permitRequired: boolean | null
  permitZoneName: string | null
  recurrenceType: string | null
  recurrenceOccurrences: number | null
  weatherFallback: string | null
  resultDeadline: string | null
  resultFormats: string[]
  deliveryMethods: string[]
  dataRetentionDays: number | null
  termsAcceptedAt: string | null
  termsVersion: string | null
  executionPlanRevision: number | null
  executionPlanStatus: string | null
  latitude: number | null
  longitude: number | null
  rejectReason: string | null
  requestedUpdateScope: 'LOCATION' | 'ADDITIONAL_INFORMATION' | null
  reviewByName: string | null
  reviewAt: string | null
  updatedAt: string | null
  deliverables: DeliverableView[]
  timeline: OrderTimelineEvent[]
}

export type OrderStats = {
  total: number
  pending: number
  needsInfo: number
  approved: number
  inProgress: number
  completed: number
  rejected: number
  cancelled: number
}
