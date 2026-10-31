import { displayOrderCode } from '../../../../shared/lib/orderCode'
import type { OrderStatus } from '../../../../shared/types/domain'
import type {
  OrderCreateResponse,
  OrderDeliverableResponse,
} from '../../api/orderApi'
import type {
  DeliverableView,
  OrderDetailView,
  OrderRow,
  OrderTimelineEvent,
} from './types'

const KNOWN: readonly OrderStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'PENDING',
  'NEEDS_INFO',
  'APPROVED',
  'SCHEDULED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]

/** Legacy AI_ANALYZED orders are displayed as submitted; unknown values fall back to PENDING. */
export function normalizeStatus(value: string | null | undefined): OrderStatus {
  if (value === 'AI_ANALYZED') return 'SUBMITTED'
  return KNOWN.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : 'PENDING'
}

/** Orders are identified by uuid; show the first block as a short code. */
export function shortOrderCode(id: string): string {
  return id.length > 12 ? id.slice(0, 8).toUpperCase() : id
}

const orNull = <T,>(value: T | null | undefined): T | null => value ?? null

export function toOrderRow(order: OrderCreateResponse): OrderRow {
  const code = displayOrderCode(order.orderCode, order.id)
  return {
    id: order.id,
    code,
    title: order.title?.trim() || code,
    address: orNull(order.address),
    dateFrom: orNull(order.preferredDateFrom),
    dateTo: orNull(order.preferredDateTo),
    timeId: orNull(order.preferredTimeId),
    timeName: orNull(order.preferredTimeName),
    serviceId: orNull(order.serviceId),
    serviceName: orNull(order.serviceName),
    status: normalizeStatus(order.orderStatus),
    radiusM: orNull(order.radiusM),
    createdAt: orNull(order.createdAt),
    depositState:
      statusDepositState(normalizeStatus(order.orderStatus), order.depositSatisfied),
  }
}

function statusDepositState(
  status: OrderStatus,
  depositSatisfied: boolean | null | undefined,
): OrderRow['depositState'] {
  if (status !== 'APPROVED') return undefined
  return depositSatisfied ? 'PAID' : 'ACTION_REQUIRED'
}

/** Hide internal bookkeeping and retired AI fields from old order payloads. */
const HIDDEN_REQUIREMENT_KEYS = new Set([
  'readinessScore',
  'aiAnalysisRequested',
])

function customerRequirementValue(key: string, value: unknown): string | null {
  if (key !== 'additionalRequirements' || !Array.isArray(value))
    return requirementText(value)

  const customerVisible = value.filter((item) => {
    if (!item || typeof item !== 'object') return true
    // Keep historical orders from exposing the retired AI add-on.
    return (item as Record<string, unknown>).type !== 'AI_IMAGE_ANALYSIS'
  })
  return requirementText(customerVisible)
}

function requirementText(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    const parts = value.map(requirementText).filter((item): item is string => Boolean(item))
    return parts.length ? parts.join('; ') : null
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const preferred = [record.description, record.documentName, record.fileName, record.name, record.type]
      .map(requirementText)
      .filter((item): item is string => Boolean(item))
    if (record.additionalPrice != null) preferred.push(`${requirementText(record.additionalPrice)} đ`)
    if (preferred.length) return preferred.join(' · ')
    return Object.entries(record)
      .map(([key, item]) => {
        const formatted = requirementText(item)
        return formatted ? `${key}: ${formatted}` : null
      })
      .filter((item): item is string => Boolean(item))
      .join(' · ') || null
  }
  return null
}

export function toDeliverableView(item: OrderDeliverableResponse): DeliverableView {
  const requirement = item.requirement ?? {}
  return {
    id: item.id,
    name: item.deliverableTypeName || item.deliverableTypeId,
    format: orNull(item.defaultFormat),
    requirements: Object.entries(requirement)
      .filter(
        ([key, value]) =>
          !HIDDEN_REQUIREMENT_KEYS.has(key) &&
          customerRequirementValue(key, value) != null,
      )
      .map(([key, value]) => ({
        key,
        value: customerRequirementValue(key, value)!,
      })),
  }
}

/**
 * The BE keeps no status history, so the timeline is derived only from the
 * fields it does return (created / review / last update).
 */
export function buildTimeline(order: OrderCreateResponse): OrderTimelineEvent[] {
  const status = normalizeStatus(order.orderStatus)
  const events: OrderTimelineEvent[] = []
  if (order.createdAt) {
    events.push({ kind: 'created', at: order.createdAt, actor: null, note: null })
  }
  const approvedStatuses: OrderStatus[] = ['APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED']
  if (order.reviewAt && (approvedStatuses.includes(status) || status === 'REJECTED')) {
    const rejected = status === 'REJECTED'
    events.push({
      kind: rejected ? 'rejected' : 'approved',
      at: order.reviewAt,
      actor: orNull(order.reviewByName),
      // The reason is shown once, in the review notice.
      note: null,
    })
  }
  const later: OrderStatus[] = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED']
  if (later.includes(status) && order.updatedAt) {
    events.push({ kind: 'status', status, at: order.updatedAt, actor: null, note: null })
  }
  return events
}

export function toOrderDetail(order: OrderCreateResponse): OrderDetailView {
  const row = toOrderRow(order)
  return {
    ...row,
    legalReviewStatus: order.legalReviewStatus ?? 'NOT_REVIEWED',
    description: orNull(order.description),
    usagePurpose: orNull(order.usagePurpose),
    flightPurpose: orNull(order.flightPurpose),
    altitudeM: orNull(order.altitudeM),
    estimatedLengthM: orNull(order.estimatedLengthM),
    siteContactName: orNull(order.siteContactName),
    siteContactPhone: orNull(order.siteContactPhone),
    accessNotes: orNull(order.accessNotes),
    monitoringRelationship: orNull(order.monitoringRelationship),
    monitoringAuthorizationConfirmed: Boolean(order.monitoringAuthorizationConfirmed),
    monitoringAuthorizationDocuments: order.monitoringAuthorizationDocuments ?? [],
    permitStatus: orNull(order.permitStatus),
    permitNumber: orNull(order.permitNumber),
    permitExpiresOn: orNull(order.permitExpiresOn),
    permitDocuments: order.permitDocuments ?? [],
    permitRequired: order.permitRequired ?? null,
    permitZoneName: orNull(order.permitZoneName),
    recurrenceType: orNull(order.recurrenceType),
    recurrenceOccurrences: orNull(order.recurrenceOccurrences),
    weatherFallback: orNull(order.weatherFallback),
    resultDeadline: orNull(order.resultDeadline),
    resultFormats: order.resultFormats ?? [],
    deliveryMethods: order.deliveryMethods ?? [],
    dataRetentionDays: orNull(order.dataRetentionDays),
    termsAcceptedAt: orNull(order.termsAcceptedAt),
    termsVersion: orNull(order.termsVersion),
    executionPlanRevision: orNull(order.executionPlanRevision),
    executionPlanStatus: orNull(order.executionPlanStatus),
    checklistItems: order.checklistItems ?? [],
    checklistSnapshotAt: orNull(order.checklistSnapshotAt),
    checklistRevision: order.checklistRevision ?? 1,
    canEditChecklist:
      order.canEditChecklist !== undefined
        ? Boolean(order.canEditChecklist)
        : (['PENDING', 'NEEDS_INFO'].includes(row.status) &&
            !(row.status === 'NEEDS_INFO' && order.requestedUpdateScope)) ||
          row.status === 'APPROVED',
    checklistEditBlockedReason: orNull(order.checklistEditBlockedReason),
    coverageArea: orNull(order.coverageArea),
    latitude: orNull(order.latitude),
    longitude: orNull(order.longitude),
    rejectReason: orNull(order.rejectReason),
    requestedUpdateScope: orNull(order.requestedUpdateScope),
    reviewByName: orNull(order.reviewByName),
    reviewAt: orNull(order.reviewAt),
    updatedAt: orNull(order.updatedAt),
    deliverables: (order.deliverables ?? []).map(toDeliverableView),
    timeline: buildTimeline(order),
  }
}
