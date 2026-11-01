import { adminApi } from '../../api/adminApi'
import { adminDevicesApi } from '../../api/adminDevicesApi'
import {
  adminUsersApi,
  type UserManagementSummaryResponse,
} from '../../api/adminUsersApi'
import { catalogApi } from '../../api/catalogApi'
import { checklistsApi } from '../../api/checklistsApi'
import { DEVICE_STATUSES, type DeviceStatus } from '../../types/devices'
import {
  groupDeviceCounts,
  splitByActive,
  summarizePolicies,
  type DeviceGroupCounts,
  type PolicySummary,
} from './dashboardStats'

export const RECENT_ACCOUNTS_SAMPLE = 200
const TEMPLATE_PROBE_LIMIT = 40

export type RecentAccounts = {
  totalItems: number
  items: UserManagementSummaryResponse[]
}

/** Newest accounts (one page); `createdAt` is the only date the BE exposes. */
export async function fetchRecentAccounts(
  signal?: AbortSignal,
): Promise<RecentAccounts> {
  const res = await adminUsersApi.listUsers({
    page: 0,
    size: RECENT_ACCOUNTS_SAMPLE,
    sort: 'createdAt,desc',
    signal,
  })
  return { totalItems: res.totalItems, items: res.items }
}

export type DeviceSummary = { groups: DeviceGroupCounts; models?: number }

/** One `size=1` count request per status (exact totals), plus the model list. */
export async function fetchDeviceSummary(
  signal?: AbortSignal,
): Promise<DeviceSummary> {
  const [counts, models] = await Promise.all([
    Promise.all(
      DEVICE_STATUSES.map((status) =>
        adminDevicesApi
          .list({ page: 0, size: 1, status, signal })
          .then((r) => r.totalItems),
      ),
    ),
    adminDevicesApi.listModels(signal).then(
      (m) => m.length,
      () => undefined,
    ),
  ])
  const byStatus: Partial<Record<DeviceStatus, number>> = {}
  DEVICE_STATUSES.forEach((s, i) => {
    byStatus[s] = counts[i]
  })
  return { groups: groupDeviceCounts(byStatus), models }
}

export type CatalogSummary = {
  active: number
  inactive: number
  total: number
  timeSlots?: number
}

export async function fetchCatalogSummary(
  signal?: AbortSignal,
): Promise<CatalogSummary> {
  const [services, timeSlots] = await Promise.all([
    catalogApi.listServices(signal),
    catalogApi.listPreferredTimes(signal).then(
      (t) => t.length,
      () => undefined,
    ),
  ])
  return { ...splitByActive(services), timeSlots }
}

export type ChecklistSummary = {
  active: number
  inactive: number
  /** Active services with an empty template; undefined when it cannot be derived. */
  servicesWithoutChecklist?: number
}

/** Counts via `size=1` totals; templates are probed per active service. */
export async function fetchChecklistSummary(
  signal?: AbortSignal,
): Promise<ChecklistSummary> {
  const [active, inactive, services] = await Promise.all([
    checklistsApi.list('', true, 0, signal, 1).then((r) => r.totalItems),
    checklistsApi.list('', false, 0, signal, 1).then((r) => r.totalItems),
    catalogApi.listServices(signal).catch(() => undefined),
  ])
  let servicesWithoutChecklist: number | undefined
  const probe = services?.filter((s) => s.isActive)
  if (probe && probe.length <= TEMPLATE_PROBE_LIMIT) {
    const templates = await Promise.allSettled(
      probe.map((s) => checklistsApi.template(s.id, signal)),
    )
    if (templates.every((t) => t.status === 'fulfilled')) {
      servicesWithoutChecklist = templates.filter(
        (t) => t.status === 'fulfilled' && t.value.length === 0,
      ).length
    }
  }
  return { active, inactive, servicesWithoutChecklist }
}

export async function fetchPolicySummary(
  signal?: AbortSignal,
): Promise<PolicySummary> {
  return summarizePolicies(await adminApi.listPricingPolicies(signal))
}
