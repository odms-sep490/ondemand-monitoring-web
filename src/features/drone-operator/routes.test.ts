import { describe, expect, it } from 'vitest'

import {
  operatorHref,
  parseOperatorRoute,
  operatorFlowStep,
  guardOperatorFlowRoute,
} from './routes'

describe('drone operator routes', () => {
  it('has separate checklist/media URLs for the same mission and the same workflow step', () => {
    expect(operatorHref({ screen: 'checklist', missionId: 'mission A' })).toBe(
      '#portal/staff/checklist/mission%20A',
    )
    expect(parseOperatorRoute('#portal/staff/checklist/mission%20A')).toEqual({
      screen: 'checklist',
      missionId: 'mission A',
    })
    expect(operatorFlowStep('checklist')).toBe(operatorFlowStep('upload'))
    expect(guardOperatorFlowRoute({ screen: 'checklist' }, 'active')).toEqual({
      screen: 'checklist',
      missionId: 'active',
    })
  })
  it('routes legacy connection links directly to preflight', () => {
    const missionId = '2bf1ecfd-d903-4c31-b53a-f673ed648830'

    expect(operatorHref({ screen: 'connect', missionId })).toBe(
      `#portal/staff/preflight/${missionId}`,
    )
    expect(parseOperatorRoute(`#portal/staff/connect/${missionId}`)).toEqual({
      screen: 'preflight',
      missionId,
    })
    expect(operatorFlowStep('connect')).toBe(operatorFlowStep('preflight'))
    expect(parseOperatorRoute(`#portal/staff/preflight/${missionId}`)).toEqual({
      screen: 'preflight',
      missionId,
    })
    expect(parseOperatorRoute(`#portal/staff/flight/${missionId}`)).toEqual({
      screen: 'flight',
      missionId,
    })
  })
})
