// Types for MNG-02 (order approval queue) and MNG-03 (order review).
// Field names follow [BE] `OrderCreateResponse` DTO (camelCase) where they
// overlap; fields only described in [BRIEF]/[TK] are added alongside and
// marked in comments. Enums come from `shared/types/domain.ts` (backend
// truth) plus `AiVerdict` (brief A4).
import type {
  AiVerdict,
  OrderStatus,
  RequiredEvidenceType,
} from '../../../shared/types/domain'

export type OrderCustomerSummary = {
  fullName: string
  companyName: string
}

/** One row of `GET /api/orders?status=PENDING` [TK path; BE OrderStatus value]. */
export type OrderQueueItem = {
  id: string
  code: string
  customer: OrderCustomerSummary
  serviceName: string
  preferredDate: string
  preferredDateFrom?: string | null
  preferredDateTo?: string | null
  preferredTimeName: string
  submittedAt: string
  aiVerdict: AiVerdict
  blockerCount: number
  warningCount: number
}

// Contact info has no source for orders the design never renders a detail
// screen for — null rather than invented when absent.
export type OrderCustomerContact = OrderCustomerSummary & {
  email: string | null
  phone: string | null
  address?: string | null
  citizenIdentificationNumber?: string | null
  companyTaxCode?: string | null
}

/** `order.media_requirements[]` item [BRIEF] — brief-only field. */
export type OrderMediaRequirement = {
  label: string
}

/** A flight-permit file the customer attached; `dataUrl` is the base64 content. */
export type OrderPermitDocument = {
  id: string
  fileName: string
  contentType: string
  sizeBytes: number
  dataUrl: string
}

export type OrderAuthorizationDocument = OrderPermitDocument & {
  documentType: string
  documentName: string
  notes?: string | null
  verificationStatus?: string | null
}

/** `order.attachments[]` item [BRIEF] — brief-only field. */
export type OrderAttachment = {
  name: string
  sizeLabel: string
  mimeType: string
  url: string
}

/**
 * `GET /api/orders/{id}` [TK] full order detail for MNG-03. Only
 * ORD-2609-0157/0160 have design-sourced detail content — every other order
 * gets `null` for the fields below rather than invented placeholder data;
 * `OrderReviewPage` renders an explicit "Chưa có dữ liệu" marker per block
 * when its field is `null`.
 */
export type OrderDetail = {
  executionPlanRevision?: number
  checklistItems?: OrderChecklistSnapshot[]
  checklistSnapshotAt?: string | null
  id: string
  code: string
  status: OrderStatus
  customer: OrderCustomerContact
  serviceName: string
  /** Optional: only present if the order API supplies the service description. */
  serviceDescription?: string | null
  preferredDate: string
  preferredDateFrom?: string | null
  preferredDateTo?: string | null
  preferredTimeName: string
  /** Precise HH:MM window — only sourced for the design's own demo order. */
  preferredWindow: string | null
  submittedAt: string
  // Location Info — brief-only fields (radiusM, center) needed
  // for the MNG-03 map/detail card, not part of OrderCreateResponse. `null`
  // when the design has no location content for this order.
  addressText: string | null
  center: { lat: number; lon: number } | null
  radiusM: number | null
  mediaRequirements: OrderMediaRequirement[] | null
  purpose: string | null
  attachments: OrderAttachment[] | null
  title?: string | null
  description?: string | null
  usagePurpose?: string | null
  flightPurpose?: string | null
  altitudeM?: number | null
  estimatedLengthM?: number | null
  siteContactName?: string | null
  siteContactPhone?: string | null
  accessNotes?: string | null
  monitoringRelationship?: string | null
  monitoringAuthorizationConfirmed?: boolean | null
  monitoringAuthorizationDocuments?: OrderAuthorizationDocument[] | null
  permitStatus?: string | null
  permitNumber?: string | null
  permitExpiresOn?: string | null
  permitDocuments?: OrderPermitDocument[] | null
  permitRequired?: boolean | null
  permitZoneName?: string | null
  recurrenceType?: string | null
  recurrenceOccurrences?: number | null
  weatherFallback?: string | null
  resultDeadline?: string | null
  resultFormats?: string[] | null
  deliveryMethods?: string[] | null
  dataRetentionDays?: number | null
  termsAcceptedAt?: string | null
  termsVersion?: string | null
  deliverables?: OrderDeliverableResponse[] | null
  legalReviewStatus?: LegalReviewStatus | null
  flightAreaReviewReason?: string | null
  flightAreaReviewNote?: string | null
  requestedScopeFeasible?: boolean | null
  flightAreaReviewedById?: string | null
  flightAreaReviewedByName?: string | null
  flightAreaReviewedAt?: string | null
  updatedAt?: string | null
}

export type LegalReviewStatus =
  | 'NOT_REVIEWED'
  | 'NOT_REQUIRED'
  | 'PENDING_PERMIT'
  | 'APPROVED'
  | 'REJECTED'

export type FlightAreaReviewRequest = {
  status: LegalReviewStatus
  requestedScopeFeasible?: boolean | null
  reason?: string | null
  note?: string | null
}

/**
 * Read-only projection of an APPROVED / IN_PROGRESS order, built client-side
 * from `GET /api/orders/{id}` to prefill CreateMissionPage (MNG-04).
 */
export type OrderMissionBrief = {
  executionPlanRevision?: number
  checklistItems?: OrderChecklistSnapshot[]
  id: string
  code: string
  serviceName: string
  customerFullName: string
  preferredDate: string
  preferredDateFrom?: string | null
  preferredDateTo?: string | null
  preferredTimeName: string
  addressText: string | null
  center: { lat: number; lon: number } | null
  radiusM: number | null
  mediaRequirements: OrderMediaRequirement[] | null
}

export type ApprovalDecision = 'REJECTED' | 'NEED_INFO'

/** Body of `POST /api/orders/{id}/approval` [BRIEF C4]. */
export type ApprovalRequest = {
  decision: ApprovalDecision
  reason: string
  requestedUpdateScope?: 'LOCATION' | 'ADDITIONAL_INFORMATION'
}

export type OrderDeliverableResponse = {
  id: string
  deliverableTypeId: string
  deliverableTypeName: string
  defaultFormat: string
  requirement: Record<string, unknown> | null
}

/** BE actual response for `GET /api/orders/pending` and related order-detail endpoints. */
export type OrderCreateResponse = {
  executionPlanRevision?: number
  executionPlanStatus?: 'DRAFT' | 'FINALIZED'
  checklistItems?: OrderChecklistSnapshot[]
  checklistSnapshotAt?: string | null
  id: string
  orderCode?: string | null
  customerId: string
  customerName: string
  customerEmail?: string | null
  customerPhoneNumber?: string | null
  customerAddress?: string | null
  customerCompanyName?: string | null
  customerCitizenIdentificationNumber?: string | null
  customerCompanyTaxCode?: string | null
  title: string
  serviceId: string
  serviceName: string
  serviceBasePriceSnapshot?: number | string | null
  serviceDescription?: string | null
  description: string
  usagePurpose?: string | null
  flightPurpose?: string | null
  altitudeM?: number | null
  estimatedLengthM?: number | null
  siteContactName?: string | null
  siteContactPhone?: string | null
  accessNotes?: string | null
  monitoringRelationship?: string | null
  monitoringAuthorizationConfirmed?: boolean | null
  monitoringAuthorizationDocuments?: OrderAuthorizationDocument[] | null
  permitStatus?: string | null
  permitNumber?: string | null
  permitExpiresOn?: string | null
  permitDocuments?: OrderPermitDocument[] | null
  permitRequired?: boolean | null
  permitZoneName?: string | null
  address: string
  longitude: number
  latitude: number
  radiusM?: number | null
  coverageArea: Record<string, unknown> | null
  preferredDateFrom: string
  preferredDateTo: string
  preferredTimeId: string
  preferredTimeName: string
  recurrenceType?: string | null
  recurrenceOccurrences?: number | null
  weatherFallback?: string | null
  resultDeadline?: string | null
  resultFormats?: string[] | null
  deliveryMethods?: string[] | null
  dataRetentionDays?: number | null
  termsAcceptedAt?: string | null
  termsVersion?: string | null
  orderStatus: OrderStatus
  rejectReason: string | null
  reviewById: string | null
  reviewByName: string | null
  reviewAt: string | null
  legalReviewStatus?: LegalReviewStatus | null
  flightAreaReviewReason?: string | null
  flightAreaReviewNote?: string | null
  requestedScopeFeasible?: boolean | null
  flightAreaReviewedById?: string | null
  flightAreaReviewedByName?: string | null
  flightAreaReviewedAt?: string | null
  deliverables: OrderDeliverableResponse[]
  createdAt: string
  updatedAt: string
}

/** Historical OrderChecklistItem DTO; never reconstructed from the catalog. */
export type OrderChecklistSnapshot = {
  id: string
  sourceChecklistId: string | null
  sourceType: 'SERVICE_TEMPLATE' | 'CUSTOMER_CUSTOM'
  content: string
  description?: string | null
  executionSteps?: string[] | null
  inputRequirements?: string[] | null
  expectedOutputs?: string[] | null
  displayOrder: number
  /** Optional for historical pre-policy snapshots. */
  minimumEvidenceCount?: number
  requiredEvidenceType?: RequiredEvidenceType
  /** Evidence policy V3: independent minimums when the type is IMAGE_AND_VIDEO. */
  minimumImageCount?: number
  minimumVideoCount?: number
}
