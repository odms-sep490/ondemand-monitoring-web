export type Step = 1 | 2 | 3 | 4 | 5 | 6
export const STEPS: readonly Step[] = [1, 2, 3, 4, 5, 6]

export type MapPoint = { x: number; y: number }

export type LocationStatus =
  'unconfirmed' | 'resolving' | 'confirmed' | 'stale' | 'error'
export type LocationSource = 'search' | 'map' | 'gps' | 'file' | 'restored' | ''

export type ReadinessScore = {
  score: number
  level: 'good' | 'warn' | 'bad'
  notes: string[]
}

export type SimulationMapMeta = {
  image?: string
  imageVersion?: string
  minX: number
  maxX: number
  minY: number
  maxY: number
  imageBounds?: { minX: number; maxX: number; minY: number; maxY: number }
  width?: number
  height?: number
}

/** Raw zone item as returned by `GET /api/zones` (all fields optional). */
export type ZonePayload = {
  id?: string
  code?: string
  name?: string
  zoneType?: string
  restricted?: boolean
  coordinates?: number[][]
}

export type SimulationZone = {
  id: string
  code: string
  name: string
  zoneType: string
  restricted: boolean
  coordinates: [number, number][]
}

export type UsagePurpose =
  '' | 'INTERNAL' | 'LEGAL' | 'PARTNER_REPORT' | 'OTHER'
/** Flight purpose per Decree 288/2025/ND-CP, Article 4.3 — only the classes this service sells. */
export const FLIGHT_PURPOSES = [
  'SURVEY_MONITORING',
  'AGRICULTURE',
  'CONSTRUCTION_MONITORING',
  'INDUSTRIAL_INSPECTION',
  'AREA_MONITORING',
  'FOREST_MONITORING',
  'OTHER',
] as const
export type FlightPurpose = (typeof FLIGHT_PURPOSES)[number]
export type PermitStatus = 'NONE' | 'HAVE_PERMIT' | 'NEED_SUPPORT'
export const MONITORING_RELATIONSHIPS = [
  'OWNER',
  'AUTHORIZED_PERSON',
  'CONTRACTOR',
  'MANAGER_OR_SUPERVISOR',
  'OTHER',
] as const
export type MonitoringRelationship = (typeof MONITORING_RELATIONSHIPS)[number]
export const AUTHORIZATION_DOCUMENT_TYPES = [
  'OWNERSHIP_PROOF',
  'OWNER_CONSENT',
  'AUTHORIZATION_LETTER',
  'SERVICE_CONTRACT',
  'ASSIGNMENT_LETTER',
  'OTHER',
] as const
export type AuthorizationDocumentType =
  (typeof AUTHORIZATION_DOCUMENT_TYPES)[number]
export type MonitoringAuthorizationDocument = CustomerOrderAttachment & {
  documentType: AuthorizationDocumentType
  documentName: string
  notes: string
}
export type RecurrenceType = 'NONE' | 'WEEKLY' | 'MONTHLY'
/** What to do when a flight cannot go ahead (weather, equipment, access, permit, safety). */
export type WeatherFallback =
  'AUTO_RESCHEDULE' | 'CONTACT_CUSTOMER' | 'CANCEL_ORDER'

export const RESULT_FORMATS = ['PHOTO', 'VIDEO', 'PDF_REPORT'] as const
export type ResultFormat = (typeof RESULT_FORMATS)[number]
export const DELIVERY_METHODS = ['DOWNLOAD', 'EMAIL'] as const
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]
export const RETENTION_DAYS = [30, 90, 180, 365] as const
export type RetentionDays = (typeof RETENTION_DAYS)[number]

export type FormState = {
  title: string
  usagePurpose: UsagePurpose
  /** Printed as the flight purpose on the flight-permit application. */
  flightPurpose: FlightPurpose
  /** Free-text detail required when `flightPurpose` is OTHER. */
  otherFlightPurpose: string
  /** Free-text detail required when `usagePurpose` is OTHER. */
  otherUsagePurpose: string
  description: string
  address: string
  normalizedAddress: string
  latitude: string
  longitude: string
  locationStatus: LocationStatus
  locationSource: LocationSource
  locationConfirmedAt: string
  radiusM: number
  monitoringRelationship: MonitoringRelationship | ''
  /** Free-text detail required when `monitoringRelationship` is OTHER. */
  otherMonitoringRelationship: string
  monitoringAuthorizationConfirmed: boolean
  monitoringAuthorizationDocuments: MonitoringAuthorizationDocument[]
  altitudeM: number
  /** Optional estimated length in metres (roads, runways, pipelines). */
  estimatedLengthM: string
  siteContactName: string
  siteContactPhone: string
  accessNotes: string
  permitStatus: PermitStatus
  permitNumber: string
  /** Last day the permit is valid (ISO date); required with HAVE_PERMIT. */
  permitExpiresOn: string
  /** Permit files (PDF or image); required with HAVE_PERMIT. */
  permitDocuments: CustomerOrderAttachment[]
  /** KML / GeoJSON / drawings describing the area. */
  areaFiles: CustomerOrderAttachment[]
  serviceId: string
  preferredDateFrom: string
  preferredDateTo: string
  preferredTimeId: string
  recurrenceType: RecurrenceType
  /** Total number of flights when the request repeats (2-52). */
  recurrenceOccurrences: number
  /** One answer for every reason a flight might not go ahead. */
  weatherFallback: WeatherFallback
  /** ISO date by which the result is needed; empty = no deadline. */
  resultDeadline: string
  deliverableTypeId: string
  mediaType: 'IMAGE' | 'VIDEO'
  quantity: number
  resolution: string
  /** Result formats wanted (photo, video, PDF report); at least one. */
  resultFormats: ResultFormat[]
  /** How the result is received; at least one. */
  deliveryMethods: DeliveryMethod[]
  /** Days the result data is kept after handover. */
  dataRetentionDays: RetentionDays
  /** Customer accepted the terms and the data-security commitment. */
  termsAccepted: boolean
  attachments: CustomerOrderAttachment[]
}

export type CustomerOrderAttachment = {
  id: string
  fileName: string
  contentType: string
  sizeBytes: number
  dataUrl: string
}

export type FormErrors = Partial<Record<keyof FormState, string>>

export type StoredCreateOrderDraft = {
  step?: Step
  form?: FormState
  mapPoint?: MapPoint
}

export type UpdateField = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void
