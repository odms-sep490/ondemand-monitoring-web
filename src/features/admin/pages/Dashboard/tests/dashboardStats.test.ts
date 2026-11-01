import { describe, expect, it } from 'vitest'

import type { PricingPolicy } from '../../../types/pricing'
import {
  buildAlerts,
  countCreatedSince,
  groupDeviceCounts,
  pickRecent,
  splitByActive,
  summarizePolicies,
  weeklyCounts,
} from '../dashboardStats'

const NOW = new Date(2026, 10, 4, 12) // Wed 2026-11-04 local

describe('groupDeviceCounts', () => {
  it('folds the 11 statuses into 5 groups and a total', () => {
    const g = groupDeviceCounts({
      AVAILABLE: 4,
      RESERVED: 1,
      IN_MISSION: 2,
      RETURNING: 1,
      CHARGING: 3,
      IDLE_CHARGING: 1,
      MAINTENANCE: 2,
      OFFLINE: 1,
      OUT_OF_SERVICE: 1,
    })
    expect(g).toEqual({
      ready: 4,
      active: 4,
      charging: 4,
      maintenance: 2,
      offline: 2,
      total: 16,
    })
  })
})

describe('account date helpers', () => {
  const at = (days: number) => ({
    createdAt: new Date(NOW.getTime() - days * 86_400_000).toISOString(),
  })

  it('counts items created within the window', () => {
    expect(countCreatedSince([at(1), at(29), at(31), at(90)], 30, NOW)).toBe(2)
  })

  it('buckets per Monday-based week, oldest first', () => {
    const pts = weeklyCounts([at(0), at(1), at(8), at(100)], 4, NOW)
    expect(pts).toHaveLength(4)
    expect(pts[3].start.getDay()).toBe(1)
    expect(pts.map((p) => p.count)).toEqual([0, 0, 1, 2])
  })

  it('picks the newest items', () => {
    const items = [
      { createdAt: '2026-01-01T00:00:00Z', id: 'a' },
      { createdAt: '2026-03-01T00:00:00Z', id: 'b' },
    ]
    expect(pickRecent(items, 1).map((i) => i.id)).toEqual(['b'])
  })
})

describe('summaries', () => {
  it('splits services by active flag', () => {
    expect(
      splitByActive([
        { isActive: true },
        { isActive: false },
        { isActive: true },
      ]),
    ).toEqual({ active: 2, inactive: 1, total: 3 })
  })

  it('picks the newest ACTIVE policy and counts drafts', () => {
    const p = (id: string, status: PricingPolicy['status'], version: number) =>
      ({ id, name: id, status, version }) as PricingPolicy
    const s = summarizePolicies([
      p('a', 'ACTIVE', 1),
      p('b', 'ACTIVE', 3),
      p('c', 'DRAFT', 4),
      p('d', 'SUPERSEDED', 0),
    ])
    expect(s.active?.id).toBe('b')
    expect(s.drafts).toBe(1)
  })
})

describe('buildAlerts', () => {
  it('returns nothing while sources are unavailable or healthy', () => {
    expect(buildAlerts({})).toEqual([])
    expect(
      buildAlerts({
        locked: 0,
        unverified: 0,
        devices: groupDeviceCounts({ AVAILABLE: 3 }),
        servicesWithoutChecklist: 0,
        policies: { active: { id: 'x' } as PricingPolicy, drafts: 0 },
      }),
    ).toEqual([])
  })

  it('emits an alert with a target route per problem, high severity first', () => {
    const alerts = buildAlerts({
      locked: 2,
      unverified: 1,
      devices: groupDeviceCounts({ MAINTENANCE: 1, OFFLINE: 2 }),
      servicesWithoutChecklist: 3,
      policies: { active: null, drafts: 2 },
    })
    expect(alerts.map((a) => [a.key, a.count])).toEqual([
      ['devicesAttention', 3],
      ['noActivePolicy', 1],
      ['servicesWithoutChecklist', 3],
      ['draftPolicies', 2],
      ['lockedAccounts', 2],
      ['unverifiedAccounts', 1],
    ])
    expect(alerts[0].route).toEqual({ screen: 'devices' })
    expect(alerts[2].route).toEqual({ screen: 'serviceChecklists' })
  })
})
