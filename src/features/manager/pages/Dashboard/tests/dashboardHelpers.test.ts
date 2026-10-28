import { describe, expect, it } from 'vitest'

import { normalizeDashboard } from '../dashboardHelpers'

describe('normalizeDashboard', () => {
  it('defaults null and omitted fields without crashing', () => {
    const data = normalizeDashboard({
      summary: null,
      orderStatusDistribution: null,
      actionItems: null,
      pricingPipeline: null,
      missionOverview: null,
      priceAdjustmentSummary: null,
    })
    expect(data.summary.totalOrders).toBe(0)
    expect(data.orderStatusDistribution).toEqual([])
    expect(data.actionItems).toEqual([])
    expect(data.recentActivities).toEqual([])
    expect(data.activeMissions).toEqual([])
    expect(data.pricingPipeline.waitingDepositCount).toBe(0)
    expect(data.missionOverview.issueCount).toBe(0)
    expect(data.priceAdjustmentSummary.adjustedByManager).toBe(0)
  })

  it('handles an empty object', () => {
    expect(normalizeDashboard({}).missionTrend).toEqual([])
  })
})
