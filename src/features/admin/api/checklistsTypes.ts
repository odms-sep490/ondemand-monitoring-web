export type ChecklistDefinition = {
  id: string
  content: string
  description?: string | null
  executionSteps?: string[] | null
  inputRequirements?: string[] | null
  expectedOutputs?: string[] | null
  isActive: boolean
  /** How many services include this checklist; editing its content changes all of them. */
  usedByServiceCount?: number
  /** How many order lines were taken from it (existing orders keep their own frozen copy). */
  usedByOrderCount?: number
  createdAt: string
  updatedAt: string | null
  version: number
  difficulty?: 'BASIC' | 'MEDIUM' | 'HARD' | 'VERY_HARD'
  /** Price of the inspection work itself (whole VND). Media is priced by the pricing profile. */
  basePrice?: number
  includedImageCount?: number
  includedVideoCount?: number
  standardVideoDurationSeconds?: number | null
  pricingProfile?: string | null
  areaPricingEnabled?: boolean
  lengthPricingEnabled?: boolean
  altitudePricingEnabled?: boolean
  includedAreaHa?: number
  includedLengthKm?: number
  includedAltitudeM?: number
}
/** Description and work guidance sent with create/edit; omitted keeps the stored value, empty clears it. */
export type ChecklistGuidanceInput = {
  description?: string
  executionSteps?: string[]
  inputRequirements?: string[]
  expectedOutputs?: string[]
}
/** Pricing configuration sent with create/edit; omitted fields keep the stored value. */
export type ChecklistPricingInput = {
  basePrice?: number
  includedImageCount?: number
  includedVideoCount?: number
  standardVideoDurationSeconds?: number | null
  pricingProfile?: string | null
  areaPricingEnabled?: boolean
  lengthPricingEnabled?: boolean
  altitudePricingEnabled?: boolean
  includedAreaHa?: number
  includedLengthKm?: number
  includedAltitudeM?: number
}
export type ChecklistPage = {
  items: ChecklistDefinition[]
  page: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}
export type ServiceChecklist = {
  id: string
  serviceId: string
  serviceName: string
  serviceActive: boolean
  checklistId: string
  content: string
  description?: string | null
  executionSteps?: string[] | null
  inputRequirements?: string[] | null
  expectedOutputs?: string[] | null
  checklistActive: boolean
  displayOrder: number
  version: number
  checklistVersion: number
  required?: boolean
  /** How many services include this checklist (this one included). */
  usedByServiceCount?: number
  /** Effective values: the association override, else inherited from the checklist. */
  basePrice?: number
  includedImageCount?: number
  includedVideoCount?: number
  pricingProfile?: string | null
  standardVideoDurationSeconds?: number | null
  basePriceOverride?: number | null
  includedImageCountOverride?: number | null
  includedVideoCountOverride?: number | null
  pricingProfileOverride?: string | null
  checklistBasePrice?: number
  checklistIncludedImageCount?: number
  checklistIncludedVideoCount?: number
  checklistPricingProfile?: string | null
}
/** Replaces the per-service overrides; null inherits the checklist definition. */
export type ServiceChecklistPricingInput = {
  basePriceOverride: number | null
  includedImageCountOverride: number | null
  includedVideoCountOverride: number | null
  pricingProfileOverride: string | null
  required: boolean
  expectedVersion?: number
}
export type ChecklistAuditAction =
  | 'CHECKLIST_CREATED'
  | 'CHECKLIST_UPDATED'
  | 'CHECKLIST_ACTIVATED'
  | 'CHECKLIST_DEACTIVATED'
  | 'SERVICE_CHECKLIST_ASSIGNED'
  | 'SERVICE_CHECKLIST_UPDATED'
  | 'SERVICE_CHECKLIST_REMOVED'
  | 'SERVICE_CHECKLIST_REORDERED'
  | 'SERVICE_CHECKLIST_FORKED'
export type ChecklistAuditChange = {
  field: string
  from: string | null
  to: string | null
}
export type ChecklistAudit = {
  id: string
  action: ChecklistAuditAction
  checklistId: string | null
  checklistContent: string | null
  serviceId: string | null
  serviceName: string | null
  actorId: string | null
  actorName: string | null
  changes: ChecklistAuditChange[]
  createdAt: string
}
export type ChecklistAuditPage = {
  items: ChecklistAudit[]
  page: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}
