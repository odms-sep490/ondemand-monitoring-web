import { describe, expect, it } from 'vitest'

import {
  groupByCategory,
  moveCriterion,
  type DeviceCheckCriterion,
} from '../../../api/deviceCheckCriteriaApi'
import { adminHref, parseAdminRoute } from '../../../routes'

function c(id: string, sortOrder: number, category: string): DeviceCheckCriterion {
  return { id, phase: 'PRE', code: id, name: id, category, required: true, active: true, sortOrder, systemLogic: false }
}

describe('device check criteria helpers', () => {
  it('groups by category keeping inspection order', () => {
    const lanes = groupByCategory([c('b', 2, 'KẾT NỐI'), c('a', 1, 'THIẾT BỊ BAY'), c('d', 4, 'THIẾT BỊ BAY'), c('x', 3, ' ')])
    expect(lanes.map((l) => l.category)).toEqual(['THIẾT BỊ BAY', 'KẾT NỐI', 'KHÁC'])
    expect(lanes[0].items.map((i) => i.id)).toEqual(['a', 'd'])
  })

  it('moves a criterion within the overall order and ignores moves past the ends', () => {
    const list = [c('a', 1, 'X'), c('b', 2, 'Y'), c('c', 3, 'X')]
    expect(moveCriterion(list, 'c', -1)).toEqual(['a', 'c', 'b'])
    expect(moveCriterion(list, 'a', 1)).toEqual(['b', 'a', 'c'])
    expect(moveCriterion(list, 'a', -1)).toEqual(['a', 'b', 'c'])
    expect(moveCriterion(list, 'c', 1)).toEqual(['a', 'b', 'c'])
  })

  it('routes the admin criteria screen', () => {
    expect(parseAdminRoute('#portal/admin/device-check-criteria')).toEqual({ screen: 'deviceCheckCriteria' })
    expect(parseAdminRoute('#portal/admin/device-check-criteria/x')).toEqual({ screen: 'notFound' })
    expect(adminHref({ screen: 'deviceCheckCriteria' })).toBe('#portal/admin/device-check-criteria')
  })
})
