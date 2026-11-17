import { apiRequest } from '../../../shared/api/httpClient'

export type DeviceCheckPhase = 'PRE' | 'POST'

export type DeviceCheckCriterion = {
  id: string
  phase: DeviceCheckPhase
  code: string
  name: string
  description?: string | null
  category: string
  required: boolean
  active: boolean
  sortOrder: number
  /** Built-in code with dedicated backend evaluation; deleting it removes that behaviour. */
  systemLogic: boolean
  createdAt?: string | null
  updatedAt?: string | null
  version?: number | null
}

export type DeviceCheckCriterionInput = {
  phase?: DeviceCheckPhase
  code?: string
  name: string
  description?: string | null
  category?: string | null
  required: boolean
  active: boolean
  version?: number | null
}

const base = '/api/admin/device-check-criteria'
const enc = encodeURIComponent

export const deviceCheckCriteriaApi = {
  list(phase: DeviceCheckPhase, signal?: AbortSignal) {
    return apiRequest<DeviceCheckCriterion[]>(base, { query: { phase }, signal })
  },
  create(input: DeviceCheckCriterionInput) {
    return apiRequest<DeviceCheckCriterion>(base, { method: 'POST', body: input })
  },
  update(id: string, input: DeviceCheckCriterionInput) {
    return apiRequest<DeviceCheckCriterion>(`${base}/${enc(id)}`, { method: 'PUT', body: input })
  },
  remove(id: string) {
    return apiRequest<void>(`${base}/${enc(id)}`, { method: 'DELETE' })
  },
  reorder(phase: DeviceCheckPhase, ids: string[]) {
    return apiRequest<DeviceCheckCriterion[]>(`${base}/reorder`, { method: 'PUT', body: { phase, ids } })
  },
}

export type CriteriaLane = { category: string; items: DeviceCheckCriterion[] }

/** Groups criteria into category lanes, keeping inspection order inside and between lanes. */
export function groupByCategory(criteria: DeviceCheckCriterion[]): CriteriaLane[] {
  const lanes = new Map<string, DeviceCheckCriterion[]>()
  for (const item of [...criteria].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const key = item.category?.trim() || 'KHÁC'
    lanes.set(key, [...(lanes.get(key) ?? []), item])
  }
  return [...lanes.entries()].map(([category, items]) => ({ category, items }))
}

/** New full id order after moving one criterion up (-1) or down (+1) in the overall inspection order. */
export function moveCriterion(criteria: DeviceCheckCriterion[], id: string, delta: -1 | 1): string[] {
  const ids = [...criteria].sort((a, b) => a.sortOrder - b.sortOrder).map((c) => c.id)
  const from = ids.indexOf(id)
  const to = from + delta
  if (from < 0 || to < 0 || to >= ids.length) return ids
  ;[ids[from], ids[to]] = [ids[to], ids[from]]
  return ids
}
