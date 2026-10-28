import { describe, expect, it } from 'vitest'

import { dedupeById } from '../scheduleHelpers'

describe('dedupeById', () => {
  it('keeps the first item for each id and preserves order', () => {
    const result = dedupeById([
      { id: 'a', n: 1 },
      { id: 'b', n: 2 },
      { id: 'a', n: 3 },
    ])
    expect(result).toEqual([
      { id: 'a', n: 1 },
      { id: 'b', n: 2 },
    ])
  })
})
