import type { RequiredEvidenceType } from '../../../../shared/types/domain'

export type ServiceChecklistItem = {
  id: string
  serviceId: string
  checklistId: string
  content: string
  description?: string | null
  executionSteps?: string[] | null
  inputRequirements?: string[] | null
  expectedOutputs?: string[] | null
  displayOrder: number
  checklistVersion: number
  serviceActive: boolean
  checklistActive: boolean
  minimumEvidenceCount?: number
  requiredEvidenceType?: RequiredEvidenceType
  /** Effective media allowance for this service (association override, else the checklist). */
  includedImageCount?: number
  includedVideoCount?: number
  required?: boolean
}

export type CatalogChecklistItem = {
  id: string
  content: string
  description?: string | null
  executionSteps?: string[] | null
  inputRequirements?: string[] | null
  expectedOutputs?: string[] | null
  version: number
  includedImageCount: number
  includedVideoCount: number
}

/**
 * Either the explicit evidence requirement (checklists without media) or the requested media counts.
 * The backend rejects both together and derives the acceptance thresholds from the requested counts.
 */
export type ChecklistInput = {
  sourceChecklistId?: string
  expectedChecklistVersion?: number
  contentOverride?: string
  minimumEvidenceCount?: number
  requiredEvidenceType?: RequiredEvidenceType
  requestedImageCount?: number
  requestedVideoCount?: number
}

export type ChecklistUpdateItemInput = {
  existingItemId?: string
  sourceChecklistId?: string
  expectedChecklistVersion?: number
  contentOverride?: string
  minimumEvidenceCount?: number
  requiredEvidenceType?: RequiredEvidenceType
  requestedImageCount?: number
  requestedVideoCount?: number
}

export type ChecklistUpdatePayload = {
  expectedRevision: number
  items: ChecklistUpdateItemInput[]
}

export type ChecklistSnapshot = {
  guidanceVersion?: number
  guidanceConfirmedVersion?: number | null
  guidanceReady?: boolean
  canEditGuidance?: boolean
  guidanceBlockedReason?: string | null
  id: string
  sourceChecklistId: string | null
  sourceChecklistVersion?: number | null
  checklistRevision?: number
  required?: boolean
  content: string
  description?: string | null
  executionSteps?: string[] | null
  inputRequirements?: string[] | null
  expectedOutputs?: string[] | null
  displayOrder: number
  sourceType: 'SERVICE_TEMPLATE' | 'CUSTOMER_SELECTED' | 'CUSTOMER_CUSTOM'
  minimumEvidenceCount?: number
  requiredEvidenceType?: RequiredEvidenceType
  evidencePolicyVersion?: number
  minimumImageCount?: number
  minimumVideoCount?: number
  includedImageCountSnapshot?: number
  includedVideoCountSnapshot?: number
  requestedImageCount?: number
  requestedVideoCount?: number
  pricingProfileSnapshot?: string | null
  basePriceSnapshot?: number
  pricingStatus?:
    | 'AUTO_PRICED'
    | 'NEEDS_MANAGER_REVIEW'
    | 'APPROVED'
    | 'ADJUSTED_AND_APPROVED'
    | 'DUPLICATE'
    | 'REJECTED'
    | 'BLOCKED_BY_POLICY'
  priceAvailable?: boolean
  approvedPrice?: number | null
}

export type ChecklistRow = {
  key: string
  existingItemId?: string | null
  sourceChecklistId: string | null
  version: number | null
  originalContent: string
  content: string
  description?: string | null
  executionSteps?: string[] | null
  inputRequirements?: string[] | null
  expectedOutputs?: string[] | null
  selected: boolean
  minimumEvidenceCount: number
  requiredEvidenceType: RequiredEvidenceType
  /** Allowance configured by the Admin; 0 for a custom checklist (the backend applies the custom policy). */
  includedImageCount: number
  includedVideoCount: number
  /** What the customer asks for. Defaults to the included allowance. */
  requestedImageCount: number
  requestedVideoCount: number
  /** The checklist cannot be removed from the order. */
  mandatory: boolean
  /** True only when the checklist was automatically supplied by the selected package. */
  packageItem?: boolean
}

/**
 * A row is priced and verified by media counts as soon as it has an allowance, the customer asks for media, or it needs
 * images AND videos (which only the per-type counts can express).
 */
export const usesMedia = (row: ChecklistRow) =>
  row.requiredEvidenceType === 'IMAGE_AND_VIDEO' ||
  row.includedImageCount + row.includedVideoCount > 0 ||
  row.requestedImageCount + row.requestedVideoCount > 0

/** Images and videos the customer asked for across the selected checklists (what the deliverables card shows). */
export function mediaTotals(rows: ChecklistRow[]): {
  images: number
  videos: number
} {
  let images = 0
  let videos = 0
  for (const row of rows) {
    if (!row.selected) continue
    if (usesMedia(row)) {
      images += row.requestedImageCount
      videos += row.requestedVideoCount
    } else if (row.requiredEvidenceType === 'VIDEO') {
      videos += row.minimumEvidenceCount
    } else {
      images += row.minimumEvidenceCount
    }
  }
  return { images, videos }
}

/** The evidence types a customer can choose. IMAGE_OR_VIDEO is legacy and never offered. */
export const EVIDENCE_TYPES = ['IMAGE', 'VIDEO', 'IMAGE_AND_VIDEO'] as const

/** Evidence type implied by a media allowance: both -> image and video, one -> that one, none -> image. */
export function evidenceTypeFor(
  includedImages: number,
  includedVideos: number,
): RequiredEvidenceType {
  if (includedImages > 0 && includedVideos > 0) return 'IMAGE_AND_VIDEO'
  if (includedVideos > 0) return 'VIDEO'
  return 'IMAGE'
}

/** The single "minimum evidence" number of an IMAGE or VIDEO row. */
export function singleEvidenceCount(row: ChecklistRow) {
  if (row.requiredEvidenceType === 'IMAGE_AND_VIDEO') return 0
  if (!usesMedia(row)) return row.minimumEvidenceCount
  return row.requiredEvidenceType === 'VIDEO'
    ? row.requestedVideoCount
    : row.requestedImageCount
}

/** Patch that sets the single minimum evidence number of an IMAGE or VIDEO row. */
export function withSingleEvidenceCount(
  row: ChecklistRow,
  count: number,
): Partial<ChecklistRow> {
  const media = row.includedImageCount + row.includedVideoCount > 0
  if (!media) return { minimumEvidenceCount: count }
  return row.requiredEvidenceType === 'VIDEO'
    ? {
        minimumEvidenceCount: count,
        requestedImageCount: 0,
        requestedVideoCount: count,
      }
    : {
        minimumEvidenceCount: count,
        requestedImageCount: count,
        requestedVideoCount: 0,
      }
}

/** Patch for switching a row's evidence type; carries the current numbers over so nothing has to be retyped. */
export function withEvidenceType(
  row: ChecklistRow,
  type: RequiredEvidenceType,
): Partial<ChecklistRow> {
  const media = row.includedImageCount + row.includedVideoCount > 0
  const carried = Math.max(
    1,
    row.requestedImageCount ||
      row.requestedVideoCount ||
      row.minimumEvidenceCount,
  )
  if (type === 'IMAGE_AND_VIDEO')
    return {
      requiredEvidenceType: type,
      requestedImageCount: Math.max(1, row.requestedImageCount || carried),
      requestedVideoCount: Math.max(1, row.requestedVideoCount || 1),
    }
  const count =
    row.requiredEvidenceType === 'IMAGE_AND_VIDEO'
      ? carried
      : singleEvidenceCount(row) || carried
  return {
    requiredEvidenceType: type,
    minimumEvidenceCount: count,
    // Rows without an allowance keep the plain evidence requirement (no priced media counts).
    requestedImageCount: media && type === 'IMAGE' ? count : 0,
    requestedVideoCount: media && type === 'VIDEO' ? count : 0,
  }
}

export const extraMedia = (requested: number, included: number) =>
  Math.max(0, requested - included)

export const normalizeContent = (content: string) =>
  // Match Java's Unicode (?U)\\s: NEL is whitespace, but BOM is not.
  content
    .normalize('NFC')
    .replace(/\p{White_Space}+/gu, ' ')
    .replace(/^ +| +$/g, '')

export function serializeChecklistUpdate(
  rows: ChecklistRow[],
): ChecklistUpdateItemInput[] {
  return rows
    .filter((row) => row.selected)
    .map((row) => {
      const content = normalizeContent(row.content)
      const evidenceRequirements = usesMedia(row)
        ? {
            requestedImageCount: row.requestedImageCount,
            requestedVideoCount: row.requestedVideoCount,
          }
        : {
            minimumEvidenceCount: row.minimumEvidenceCount,
            requiredEvidenceType: row.requiredEvidenceType,
          }
      if (row.existingItemId) {
        return {
          existingItemId: row.existingItemId,
          ...evidenceRequirements,
          ...(content !== normalizeContent(row.originalContent)
            ? { contentOverride: content }
            : {}),
        }
      }
      if (!row.sourceChecklistId) {
        return { contentOverride: content, ...evidenceRequirements }
      }
      return {
        sourceChecklistId: row.sourceChecklistId,
        expectedChecklistVersion: row.version ?? 0,
        ...evidenceRequirements,
        ...(content !== normalizeContent(row.originalContent)
          ? { contentOverride: content }
          : {}),
      }
    })
}

export function serializeChecklist(rows: ChecklistRow[]): ChecklistInput[] {
  return rows
    .filter((row) => row.selected)
    .map((row) => {
      const content = normalizeContent(row.content)
      const evidenceRequirements = usesMedia(row)
        ? {
            requestedImageCount: row.requestedImageCount,
            requestedVideoCount: row.requestedVideoCount,
          }
        : {
            minimumEvidenceCount: row.minimumEvidenceCount,
            requiredEvidenceType: row.requiredEvidenceType,
          }
      if (!row.sourceChecklistId)
        return { contentOverride: content, ...evidenceRequirements }
      return {
        sourceChecklistId: row.sourceChecklistId,
        expectedChecklistVersion: row.version!,
        ...evidenceRequirements,
        ...(content !== normalizeContent(row.originalContent)
          ? { contentOverride: content }
          : {}),
      }
    })
}
