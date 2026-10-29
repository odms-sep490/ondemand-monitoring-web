import { describe, expect, it } from 'vitest'

import { operatorApiMessages } from './operatorApi.messages'

describe('operatorApiMessages', () => {
  it('provides Vietnamese text', () => {
    expect(operatorApiMessages.vi.loadFailed(500)).toBe(
      'Không tải được danh sách người vận hành (HTTP 500)',
    )
  })

  it('provides English text', () => {
    expect(operatorApiMessages.en.loadFailed(500)).toBe(
      'Failed to load operators (HTTP 500)',
    )
  })
})
