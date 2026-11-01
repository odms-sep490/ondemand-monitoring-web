import type { PricingPolicy } from '../../types/pricing'
import type { AdminRoute } from '../../routes'
import type { DeviceStatus } from '../../types/devices'

/** Device statuses folded into the five groups shown on the dashboard. */
export const DEVICE_GROUPS = {
  ready: ['AVAILABLE'],
  active: [
    'RESERVED',
    'PREFLIGHT',
    'IN_MISSION',
    'ACTIVE_MISSION',
    'RETURNING',
  ],
  charging: ['CHARGING', 'IDLE_CHARGING'],
  maintenance: ['MAINTENANCE'],
  offline: ['OUT_OF_SERVICE', 'OFFLINE'],
} as const satisfies Record<string, readonly DeviceStatus[]>

export type DeviceGroupKey = keyof typeof DEVICE_GROUPS
export type DeviceGroupCounts = Record<DeviceGroupKey, number> & {
  total: number
}

export function groupDeviceCounts(
  byStatus: Partial<Record<DeviceStatus, number>>,
): DeviceGroupCounts {
  const out = { total: 0 } as DeviceGroupCounts
  for (const key of Object.keys(DEVICE_GROUPS) as DeviceGroupKey[]) {
    out[key] = DEVICE_GROUPS[key].reduce(
      (sum, status) => sum + (byStatus[status] ?? 0),
      0,
    )
    out.total += out[key]
  }
  return out
}

const DAY_MS = 86_400_000

/** How many items were created within the last `days` days. */
export function countCreatedSince(
  items: { createdAt: string }[],
  days: number,
  now: Date,
): number {
  const from = now.getTime() - days * DAY_MS
  return items.filter((i) => {
    const at = Date.parse(i.createdAt)
    return Number.isFinite(at) && at >= from && at <= now.getTime()
  }).length
}

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Monday
  return d
}

export type WeekPoint = { start: Date; count: number }

/** Items bucketed per Monday-based week, oldest first, ending at the current week. */
export function weeklyCounts(
  items: { createdAt: string }[],
  weeks: number,
  now: Date,
): WeekPoint[] {
  const last = startOfWeek(now)
  const points: WeekPoint[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(last)
    start.setDate(start.getDate() - i * 7)
    points.push({ start, count: 0 })
  }
  for (const item of items) {
    const at = Date.parse(item.createdAt)
    if (!Number.isFinite(at)) continue
    const point = [...points].reverse().find((p) => p.start.getTime() <= at)
    if (point && at <= now.getTime()) point.count += 1
  }
  return points
}

/** Newest first by `createdAt`, first `n`. */
export function pickRecent<T extends { createdAt: string }>(
  items: T[],
  n: number,
): T[] {
  return [...items]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, n)
}

export function splitByActive(rows: { isActive: boolean }[]) {
  const active = rows.filter((r) => r.isActive).length
  return { active, inactive: rows.length - active, total: rows.length }
}

export type PolicySummary = { active: PricingPolicy | null; drafts: number }

export function summarizePolicies(policies: PricingPolicy[]): PolicySummary {
  const actives = policies.filter((p) => p.status === 'ACTIVE')
  const active = actives.sort((a, b) => b.version - a.version)[0] ?? null
  return { active, drafts: policies.filter((p) => p.status === 'DRAFT').length }
}

export type AlertKey =
  | 'lockedAccounts'
  | 'unverifiedAccounts'
  | 'devicesAttention'
  | 'servicesWithoutChecklist'
  | 'draftPolicies'
  | 'noActivePolicy'

export type DashboardAlert = {
  key: AlertKey
  count: number
  severity: 'high' | 'medium' | 'low'
  route: AdminRoute
}

/** Inputs are `undefined` when their source is loading or failed: no alert then. */
export type AlertInput = {
  locked?: number
  unverified?: number
  devices?: DeviceGroupCounts
  servicesWithoutChecklist?: number
  policies?: PolicySummary
}

export function buildAlerts(input: AlertInput): DashboardAlert[] {
  const alerts: DashboardAlert[] = []
  const add = (a: DashboardAlert) => a.count > 0 && alerts.push(a)
  const { locked, unverified, devices, policies } = input
  if (devices)
    add({
      key: 'devicesAttention',
      count: devices.maintenance + devices.offline,
      severity: 'high',
      route: { screen: 'devices' },
    })
  if (policies && !policies.active)
    add({
      key: 'noActivePolicy',
      count: 1,
      severity: 'high',
      route: { screen: 'operatingConfig' },
    })
  add({
    key: 'servicesWithoutChecklist',
    count: input.servicesWithoutChecklist ?? 0,
    severity: 'medium',
    route: { screen: 'serviceChecklists' },
  })
  add({
    key: 'draftPolicies',
    count: policies?.drafts ?? 0,
    severity: 'medium',
    route: { screen: 'operatingConfig' },
  })
  add({
    key: 'lockedAccounts',
    count: locked ?? 0,
    severity: 'low',
    route: { screen: 'accounts' },
  })
  add({
    key: 'unverifiedAccounts',
    count: unverified ?? 0,
    severity: 'low',
    route: { screen: 'accounts' },
  })
  return alerts
}
