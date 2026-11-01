import { apiRequest } from '../../../shared/api/httpClient'
import type {
  ChecklistAuditPage,
  ChecklistDefinition,
  ChecklistGuidanceInput,
  ChecklistPage,
  ChecklistPricingInput,
  ServiceChecklist,
  ServiceChecklistPricingInput,
} from './checklistsTypes'

export * from './checklistsTypes'

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
