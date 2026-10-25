import { apiRequest } from '../../../shared/api/httpClient'

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
const enc = encodeURIComponent
const catalog = '/api/admin/checklists'
const template = (id: string) => `/api/admin/services/${enc(id)}/checklists`
export const checklistsApi = {
  get(id: string, signal?: AbortSignal) {
    return apiRequest<ChecklistDefinition>(`${catalog}/${enc(id)}`, { signal })
  },
  /** Gives the service its own copy of a shared checklist; the other services keep the original. */
  fork(serviceId: string, checklistId: string) {
    return apiRequest<ServiceChecklist>(
      `${template(serviceId)}/${enc(checklistId)}/fork`,
      { method: 'POST' },
    )
  },
  /** Change history of the checklist library and of service templates, newest first. */
  audits(
    filter: { checklistId?: string; serviceId?: string; page?: number },
    signal?: AbortSignal,
  ) {
    return apiRequest<ChecklistAuditPage>('/api/admin/checklist-audits', {
      query: {
        checklistId: filter.checklistId,
        serviceId: filter.serviceId,
        page: filter.page ?? 0,
        size: 20,
      },
      signal,
    })
  },
  list(
    search: string,
    active: boolean | undefined,
    page: number,
    signal?: AbortSignal,
    size = 20,
  ) {
    return apiRequest<ChecklistPage>(catalog, {
      query: {
        search: search.trim() || undefined,
        active,
        page,
        size,
        sort: 'createdAt,desc',
      },
      signal,
    })
  },
  create(
    content: string,
    difficulty?: ChecklistDefinition['difficulty'],
    pricing?: ChecklistPricingInput & ChecklistGuidanceInput,
  ) {
    return apiRequest<ChecklistDefinition>(catalog, {
      method: 'POST',
      body: { content, ...(difficulty ? { difficulty } : {}), ...pricing },
    })
  },
  update(
    id: string,
    content: string,
    difficulty?: ChecklistDefinition['difficulty'],
    pricing?: ChecklistPricingInput & ChecklistGuidanceInput,
  ) {
    return apiRequest<ChecklistDefinition>(`${catalog}/${enc(id)}`, {
      method: 'PUT',
      body: { content, ...(difficulty ? { difficulty } : {}), ...pricing },
    })
  },
  status(id: string, active: boolean) {
    return apiRequest<ChecklistDefinition>(`${catalog}/${enc(id)}/status`, {
      method: 'PATCH',
      body: { active },
    })
  },
  services(id: string, signal?: AbortSignal) {
    return apiRequest<ServiceChecklist[]>(`${catalog}/${enc(id)}/services`, {
      signal,
    })
  },
  template(id: string, signal?: AbortSignal) {
    return apiRequest<ServiceChecklist[]>(template(id), { signal })
  },
  assign(serviceId: string, checklistId: string, displayOrder: number) {
    return apiRequest<ServiceChecklist>(template(serviceId), {
      method: 'POST',
      body: { checklistId, displayOrder },
    })
  },
  updatePricing(
    serviceId: string,
    checklistId: string,
    input: ServiceChecklistPricingInput,
  ) {
    return apiRequest<ServiceChecklist>(
      `${template(serviceId)}/${enc(checklistId)}/pricing`,
      { method: 'PUT', body: input },
    )
  },
  remove(serviceId: string, checklistId: string) {
    return apiRequest<void>(`${template(serviceId)}/${enc(checklistId)}`, {
      method: 'DELETE',
    })
  },
  reorder(serviceId: string, rows: ServiceChecklist[]) {
    return apiRequest<ServiceChecklist[]>(`${template(serviceId)}/order`, {
      method: 'PUT',
      body: {
        items: rows.map((row) => ({
          checklistId: row.checklistId,
          expectedVersion: row.version,
        })),
      },
    })
  },
}
