import { describe, expect, it } from 'vitest'
import { isValidServiceImage } from './serviceImage'

describe('isValidServiceImage', () => {
  it('accepts JPEG, PNG and WebP within 5 MB', () => {
    expect(isValidServiceImage({ type: 'image/png', size: 10 })).toBe(true)
    expect(
      isValidServiceImage({ type: 'image/webp', size: 5 * 1024 * 1024 }),
    ).toBe(true)
  })
  it('rejects other types, empty files and files over 5 MB', () => {
    expect(isValidServiceImage({ type: 'image/gif', size: 10 })).toBe(false)
    expect(isValidServiceImage({ type: 'image/png', size: 0 })).toBe(false)
    expect(
      isValidServiceImage({ type: 'image/png', size: 5 * 1024 * 1024 + 1 }),
    ).toBe(false)
  })
})
