import { ApiError, apiRequest } from '../../../shared/api/httpClient'
import { readOrderChecklistSnapshot } from '../lib/orderChecklistSnapshot'
import type {
  ApprovalRequest,
  OrderCreateResponse,
  OrderDetail,
  OrderInternalNote,
  OrderMissionBrief,
  OrderResourcePreview,
  FlightAreaReviewRequest,
} from '../types/orders'

function formatRequirementValue(value: unknown, suffix = '') {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (value === '') return null
  return `${value}${suffix}`
}

function formatRequirement(requirement: Record<string, unknown> | null) {
  if (!requirement) return ''
  const parts = [
    formatRequirementValue(requirement.mediaType),
    formatRequirementValue(requirement.quantity, ' mục'),
    formatRequirementValue(requirement.resolution),
    formatRequirementValue(requirement.radiusM, ' m'),
    formatRequirementValue(requirement.estimatedAreaHa, ' ha'),
  ].filter(Boolean)
  return parts.length > 0 ? ` · ${parts.join(' · ')}` : ''
}

function numberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function radiusFromDeliverables(order: OrderCreateResponse) {
  for (const deliverable of order.deliverables ?? []) {
    const radius =
      numberValue(deliverable.requirement?.radiusM) ??
      numberValue(deliverable.requirement?.radius_m)
    if (radius != null) return radius
  }
  return null
}

function attachmentsFromDeliverables(order: OrderCreateResponse) {
  const files = new Map<
    string,
    NonNullable<OrderDetail['attachments']>[number]
  >()
  for (const deliverable of order.deliverables ?? []) {
    const requirement = deliverable.requirement
    if (!requirement) continue
    for (const key of ['areaFiles', 'customerAttachments'] as const) {
      const candidates = requirement[key]
      if (!Array.isArray(candidates)) continue
      for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object') continue
        const file = candidate as Record<string, unknown>
        const name = typeof file.fileName === 'string' ? file.fileName : null
        const url = typeof file.dataUrl === 'string' ? file.dataUrl : null
        if (!name || !url) continue
        const sizeBytes = numberValue(file.sizeBytes)
        files.set(`${name}:${url}`, {
          name,
          sizeLabel:
            sizeBytes == null
              ? 'Không rõ dung lượng'
              : `${(sizeBytes / 1_000_000).toFixed(2)} MB`,
          mimeType:
            typeof file.contentType === 'string'
              ? file.contentType
              : 'application/octet-stream',
          url,
        })
      }
    }
  }
  return [...files.values()]
}

function toOrderDetail(order: OrderCreateResponse): OrderDetail {
  return {
    executionPlanRevision: order.executionPlanRevision,
    id: order.id,
    code: order.id,
    status: order.orderStatus,
    customer: {
      fullName: order.customerName || order.customerId,
      companyName: order.customerCompanyName ?? '',
      email: order.customerEmail ?? null,
      phone: order.customerPhoneNumber ?? null,
      address: order.customerAddress ?? null,
      citizenIdentificationNumber:
        order.customerCitizenIdentificationNumber ?? null,
      companyTaxCode: order.customerCompanyTaxCode ?? null,
    },
    serviceName: order.serviceName,
    serviceDescription: order.serviceDescription ?? null,
    preferredDate: order.preferredDateFrom,
    preferredDateFrom: order.preferredDateFrom,
    preferredDateTo: order.preferredDateTo,
    preferredTimeName: order.preferredTimeName,
    preferredWindow: order.preferredTimeName || null,
    submittedAt: order.createdAt,
    addressText: order.address || null,
    center:
      order.latitude != null && order.longitude != null
        ? { lat: order.latitude, lon: order.longitude }
        : null,
    radiusM: order.radiusM ?? radiusFromDeliverables(order),
    nearestBase: null,
    mediaRequirements:
      order.deliverables?.map((item) => ({
        label: `${item.deliverableTypeName}${formatRequirement(item.requirement)}`,
      })) ?? null,
    purpose: order.description || null,
    attachments: attachmentsFromDeliverables(order),
    title: order.title,
    description: order.description,
    usagePurpose: order.usagePurpose ?? null,
    flightPurpose: order.flightPurpose ?? null,
    altitudeM: order.altitudeM ?? null,
    estimatedLengthM: order.estimatedLengthM ?? null,
    siteContactName: order.siteContactName ?? null,
    siteContactPhone: order.siteContactPhone ?? null,
    accessNotes: order.accessNotes ?? null,
    monitoringRelationship: order.monitoringRelationship ?? null,
    monitoringAuthorizationConfirmed:
      order.monitoringAuthorizationConfirmed ?? null,
    monitoringAuthorizationDocuments:
      order.monitoringAuthorizationDocuments ?? null,
    permitStatus: order.permitStatus ?? null,
    permitNumber: order.permitNumber ?? null,
    permitExpiresOn: order.permitExpiresOn ?? null,
    permitDocuments: order.permitDocuments ?? null,
    permitRequired: order.permitRequired ?? null,
    permitZoneName: order.permitZoneName ?? null,
    recurrenceType: order.recurrenceType ?? null,
    recurrenceOccurrences: order.recurrenceOccurrences ?? null,
    weatherFallback: order.weatherFallback ?? null,
    resultDeadline: order.resultDeadline ?? null,
    resultFormats: order.resultFormats ?? null,
    deliveryMethods: order.deliveryMethods ?? null,
    dataRetentionDays: order.dataRetentionDays ?? null,
    termsAcceptedAt: order.termsAcceptedAt ?? null,
    termsVersion: order.termsVersion ?? null,
    deliverables: order.deliverables ?? null,
    legalReviewStatus: order.legalReviewStatus ?? 'NOT_REVIEWED',
    flightAreaReviewReason: order.flightAreaReviewReason ?? null,
    flightAreaReviewNote: order.flightAreaReviewNote ?? null,
    requestedScopeFeasible: order.requestedScopeFeasible ?? null,
    flightAreaReviewedById: order.flightAreaReviewedById ?? null,
    flightAreaReviewedByName: order.flightAreaReviewedByName ?? null,
    flightAreaReviewedAt: order.flightAreaReviewedAt ?? null,
    updatedAt: order.updatedAt ?? null,
  }
}

function toOrderMissionBrief(order: OrderDetail): OrderMissionBrief {
  return {
    executionPlanRevision: order.executionPlanRevision,
    checklistItems: order.checklistItems,
    id: order.id,
    code: order.code,
    serviceName: order.serviceName,
    customerFullName: order.customer.fullName,
    preferredDate: order.preferredDate,
    preferredDateFrom: order.preferredDateFrom ?? order.preferredDate,
    preferredDateTo: order.preferredDateTo ?? order.preferredDate,
    preferredTimeName: order.preferredTimeName,
    addressText: order.addressText,
    center: order.center,
    radiusM: order.radiusM,
    nearestBase: order.nearestBase,
    mediaRequirements: order.mediaRequirements,
  }
}

/** MNG-02 / MNG-03 order-review APIs. See evd/00-PLAN.md §3. */
export const ordersApi = {
  /** `GET /api/orders/pending` [BE]. */
  getQueue(signal?: AbortSignal): Promise<OrderCreateResponse[]> {
    return apiRequest<OrderCreateResponse[]>('/api/orders/pending', {
      signal,
    })
  },

  /** `GET /api/orders/managed?status=` [BE]: every order, newest first. */
  getManaged(
    status?: string,
    signal?: AbortSignal,
  ): Promise<OrderCreateResponse[]> {
    return apiRequest<OrderCreateResponse[]>('/api/orders/managed', {
      query: status ? { status } : undefined,
      signal,
    })
  },

  /** `GET /api/orders/approved` [BE]. */
  getApproved(signal?: AbortSignal): Promise<OrderCreateResponse[]> {
    return apiRequest<OrderCreateResponse[]>('/api/orders/approved', {
      signal,
    })
  },

  /** `GET /api/orders/{id}` [TK]. */
  getOrder(id: string, signal?: AbortSignal): Promise<OrderDetail> {
    return apiRequest<OrderCreateResponse | OrderDetail>(`/api/orders/${id}`, {
      signal,
    }).then((order) => ({
      ...('customer' in order ? order : toOrderDetail(order)),
      ...readOrderChecklistSnapshot(order, id),
    }))
  },

  /**
   * `GET /api/orders/{id}/resource-preview` — PROPOSED, no source endpoint.
   * `null` for orders without design-sourced preview content.
   */
  getResourcePreview(
    id: string,
    signal?: AbortSignal,
  ): Promise<OrderResourcePreview | null> {
    return apiRequest<OrderResourcePreview | null>(
      `/api/orders/${id}/resource-preview`,
      { signal },
    )
  },

  /** `PUT /api/orders/{id}/internal-note` — PROPOSED, no source endpoint. */
  saveInternalNote(id: string, note: string): Promise<OrderInternalNote> {
    return apiRequest<OrderInternalNote>(`/api/orders/${id}/internal-note`, {
      method: 'PUT',
      body: { note },
    })
  },

  saveFlightAreaReview(
    id: string,
    request: FlightAreaReviewRequest,
  ): Promise<OrderCreateResponse> {
    return apiRequest<OrderCreateResponse>(
      `/api/orders/${encodeURIComponent(id)}/flight-area-review`,
      { method: 'POST', body: request },
    )
  },

  resolveLegalReview(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    note?: string,
  ): Promise<OrderCreateResponse> {
    return apiRequest<OrderCreateResponse>(
      `/api/orders/${encodeURIComponent(id)}/legal-review/resolve`,
      { method: 'POST', body: { status, note } },
    )
  },

  cancelAfterPermitRejection(
    id: string,
    reason: string,
  ): Promise<OrderCreateResponse> {
    return apiRequest<OrderCreateResponse>(
      `/api/orders/${encodeURIComponent(id)}/permit-cancellation`,
      { method: 'POST', body: { reason } },
    )
  },

  /** `POST /api/orders/{id}/approve` [BE] — approves only; staff schedules the mission later. */
  approve(id: string): Promise<OrderCreateResponse | void> {
    return apiRequest<OrderCreateResponse | void>(`/api/orders/${id}/approve`, {
      method: 'POST',
    })
  },

  /** `POST /api/orders/{id}/approval` [BRIEF C4] `{decision, reason}`. */
  submitApproval(id: string, request: ApprovalRequest): Promise<void> {
    return apiRequest<void>(`/api/orders/${id}/approval`, {
      method: 'POST',
      body: request,
    })
  },

  /** Read-only order projection used to prefill CreateMissionPage (MNG-04). */
  getOrderForMission(
    id: string,
    signal?: AbortSignal,
  ): Promise<OrderMissionBrief> {
    return this.getOrder(id, signal)
      .then((order) => {
        if (order.status !== 'APPROVED' && order.status !== 'IN_PROGRESS') {
          throw new ApiError('Đơn không còn ở trạng thái đã duyệt.', {
            status: 409,
            method: 'GET',
            path: `/api/orders/${id}`,
          })
        }
        return toOrderMissionBrief(order)
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 409) {
          return apiRequest<OrderMissionBrief>(
            `/api/orders/${id}/mission-brief`,
            {
              signal,
            },
          )
        }
        throw error
      })
  },
}
