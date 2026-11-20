import { describe, expect, it } from 'vitest'

import { actionItemRoute, normalizeDashboard } from '../dashboardHelpers'

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

  it('routes MISSION_PLANNING items with a missionId to missionSetup', () => {
    expect(
      actionItemRoute({
        id: 'item-1',
        type: 'MISSION_PLANNING',
        orderId: 'order-1',
        missionId: 'mission-1',
        title: 'Continue planning',
        severity: 'MEDIUM',
        actionType: 'OPEN_PLANNING',
      } as never),
    ).toEqual({ screen: 'missionSetup', missionId: 'mission-1' })
  })
})
