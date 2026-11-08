import { describe, expect, it } from 'vitest'

import { todayPlus } from './format'

describe('todayPlus', () => {
  it('uses the Asia/Ho_Chi_Minh calendar date near midnight', () => {
    expect(todayPlus(7, new Date('2026-11-07T17:30:00.000Z'))).toBe(
      '2026-11-15',
    )
    expect(todayPlus(7, new Date('2026-11-08T16:30:00.000Z'))).toBe(
      '2026-11-15',
    )
  })

  it('moves across month and year boundaries using calendar days', () => {
    expect(todayPlus(7, new Date('2026-01-26T05:30:00.000Z'))).toBe(
      '2026-02-02',
    )
    expect(todayPlus(7, new Date('2026-12-28T05:30:00.000Z'))).toBe(
      '2027-01-04',
    )
  })
})
