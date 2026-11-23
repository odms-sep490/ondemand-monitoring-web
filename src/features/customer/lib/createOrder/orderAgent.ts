import type { CreateOrderPayload } from '../../api/customerApi'
import type { ChecklistInput } from '../checklist/types'
import { isValidCoverageArea } from './coverageGeometry'
import {
  DELIVERY_METHODS,
  FLIGHT_PURPOSES,
  MONITORING_RELATIONSHIPS,
  RESULT_FORMATS,
  RETENTION_DAYS,
  type FormState,
} from './types'

export type AgentChanges = Partial<
  Pick<
    FormState,
    | 'serviceId'
    | 'description'
    | 'flightPurpose'
    | 'otherFlightPurpose'
    | 'siteContactName'
    | 'siteContactPhone'
    | 'accessNotes'
    | 'altitudeM'
    | 'estimatedLengthM'
    | 'monitoringRelationship'
    | 'preferredDateFrom'
    | 'preferredDateTo'
    | 'preferredTimeId'
    | 'resultDeadline'
    | 'recurrenceType'
    | 'recurrenceOccurrences'
    | 'weatherFallback'
  >
> & { checklistItems?: ChecklistInput[] }
export type OrderAgentSession = {
  id: string
  revision: number
  expiresAt: string
  state: {
    messages: Array<{
      role: 'user' | 'assistant'
      content: string
      requestId?: string
    }>
    confirmedFields: AgentChanges
    pendingChanges: AgentChanges
    requestedUiAction?: '' | 'MAP' | 'SCHEDULE' | 'SITE_DETAILS' | 'REVIEW'
    readyForReview: boolean
    canonicalDraft?: CreateOrderPayload
    validation?: {
      readyForReview: boolean
      invalidFields: Record<string, string>
      fieldSteps?: Record<string, number>
    }
  }
}

/** Customer confirmation only. The model cannot set geometry, permissions or terms. */
export function applyConfirmedAgentChanges(
  current: FormState,
  changes: AgentChanges,
): FormState {
  const allowed = [
    'serviceId',
    'description',
    'flightPurpose',
    'otherFlightPurpose',
    'siteContactName',
    'siteContactPhone',
    'accessNotes',
    'altitudeM',
    'estimatedLengthM',
    'monitoringRelationship',
    'preferredDateFrom',
    'preferredDateTo',
    'preferredTimeId',
    'resultDeadline',
    'recurrenceType',
    'recurrenceOccurrences',
    'weatherFallback',
    'checklistItems',
  ]
  if (Object.keys(changes).some((key) => !allowed.includes(key)))
    throw new Error('AI đề xuất trường không được phép.')
  const { checklistItems, ...fields } = changes
  const changedService = Boolean(
    fields.serviceId && fields.serviceId !== current.serviceId,
  )
  return {
    ...current,
    ...fields,
    ...(changedService
      ? {
          deliverableTypeId: '',
          descriptionAssistant: undefined,
          agentChecklistItems: undefined,
        }
      : {}),
    ...(checklistItems ? { agentChecklistItems: checklistItems } : {}),
  }
}

function member<T extends string | number>(
  value: unknown,
  values: readonly T[],
  label: string,
): T {
  if (!values.includes(value as T))
    throw new Error(`Dữ liệu ${label} chưa hợp lệ.`)
  return value as T
}

/** Converts the actual Spring OrderCreateRequest, never an AI readiness assertion. */
export function canonicalDraftToFormState(
  current: FormState,
  session: OrderAgentSession,
): FormState {
  const draft = session.state.canonicalDraft
  if (!session.state.readyForReview || !draft)
    throw new Error('Bản nháp chưa được hệ thống xác thực.')
  if (
    current.locationStatus !== 'confirmed' ||
    !current.locationConfirmedAt ||
    !draft.coverageArea.coordinates.every((ring) =>
      ring.every((point) => point.length === 2 && point.every(Number.isFinite)),
    ) ||
    !isValidCoverageArea(draft.coverageArea as FormState['coverageArea']) ||
    JSON.stringify(current.coverageArea) !==
      JSON.stringify(draft.coverageArea) ||
    Number(current.latitude) !== draft.latitude ||
    Number(current.longitude) !== draft.longitude
  )
    throw new Error('Hãy xác nhận khu vực trên bản đồ trước khi mở xem lại.')
  if (
    !draft.serviceId ||
    !draft.checklistItems?.length ||
    !draft.deliverables.length ||
    !draft.termsAccepted ||
    !draft.monitoringAuthorizationConfirmed ||
    !/^\d{4}-\d{2}-\d{2}$/.test(draft.preferredDateFrom) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(draft.preferredDateTo) ||
    !draft.preferredTimeId
  )
    throw new Error('Bản nháp xác thực còn thiếu dữ liệu.')
  const first = draft.deliverables[0]
  const requirement = first.requirement
  return {
    ...current,
    title: draft.title,
    serviceId: draft.serviceId,
    description: draft.description ?? '',
    flightPurpose: member(
      draft.flightPurpose,
      FLIGHT_PURPOSES,
      'mục đích chuyến bay',
    ),
    address: draft.address ?? current.address,
    normalizedAddress: draft.address ?? current.normalizedAddress,
    longitude: String(draft.longitude),
    latitude: String(draft.latitude),
    coverageArea: draft.coverageArea as FormState['coverageArea'],
    altitudeM: draft.altitudeM ?? current.altitudeM,
    estimatedLengthM:
      draft.estimatedLengthM == null ? '' : String(draft.estimatedLengthM),
    siteContactName: draft.siteContactName ?? '',
    siteContactPhone: draft.siteContactPhone ?? '',
    accessNotes: draft.accessNotes ?? '',
    permitStatus: draft.permitStatus ?? current.permitStatus,
    permitNumber: draft.permitNumber ?? '',
    permitExpiresOn: draft.permitExpiresOn ?? '',
    permitDocuments: draft.permitDocuments ?? [],
    monitoringRelationship: member(
      draft.monitoringRelationship,
      MONITORING_RELATIONSHIPS,
      'quyền giám sát',
    ),
    monitoringAuthorizationConfirmed: draft.monitoringAuthorizationConfirmed,
    preferredDateFrom: draft.preferredDateFrom,
    preferredDateTo: draft.preferredDateTo,
    preferredTimeId: draft.preferredTimeId,
    recurrenceType: member(
      draft.recurrenceType ?? 'NONE',
      ['NONE', 'WEEKLY', 'MONTHLY'] as const,
      'lặp lịch',
    ),
    recurrenceOccurrences:
      draft.recurrenceOccurrences ?? current.recurrenceOccurrences,
    weatherFallback: member(
      draft.weatherFallback ?? 'CONTACT_CUSTOMER',
      ['AUTO_RESCHEDULE', 'CONTACT_CUSTOMER', 'CANCEL_ORDER'] as const,
      'xử lý lịch',
    ),
    resultDeadline: draft.resultDeadline ?? '',
    resultFormats: (draft.resultFormats ?? []).map((value) =>
      member(value, RESULT_FORMATS, 'sản phẩm'),
    ),
    deliveryMethods: (draft.deliveryMethods ?? []).map((value) =>
      member(value, DELIVERY_METHODS, 'bàn giao'),
    ),
    dataRetentionDays: member(
      draft.dataRetentionDays,
      RETENTION_DAYS,
      'thời hạn lưu trữ',
    ),
    termsAccepted: draft.termsAccepted,
    deliverableTypeId: first.deliverableTypeId,
    mediaType: requirement.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
    quantity:
      typeof requirement.quantity === 'number'
        ? requirement.quantity
        : current.quantity,
    agentChecklistItems: draft.checklistItems,
    orderAgentSessionId: session.id,
  }
}
