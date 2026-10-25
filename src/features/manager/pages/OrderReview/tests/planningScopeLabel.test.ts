import { describe, expect, it } from 'vitest'

import { localizePlanningScopeLabel } from '../components/planningScopeLabel'

describe('localizePlanningScopeLabel', () => {
  it('translates legacy whole-order labels into Vietnamese', () => {
    expect(localizePlanningScopeLabel('Whole Order scope', 'vi')).toBe(
      'Toàn bộ phạm vi đơn hàng',
    )
  })

  it('keeps custom scope names unchanged', () => {
    expect(localizePlanningScopeLabel('Khu A', 'vi')).toBe('Khu A')
  })
})
