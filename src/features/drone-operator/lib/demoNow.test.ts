import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const settings = vi.hoisted(() => ({ useMockApi: true }))
vi.mock('../../../config/env', () => ({ env: settings }))

import { demoNow } from './demoNow'

describe('demoNow', () => {
  beforeEach(() => {
    settings.useMockApi = true
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the fixed 19/09/2026 14:32 (+07:00) demo clock', () => {
    const now = demoNow()
    // Compare via the UTC-equivalent instant so this test is timezone-safe.
    expect(now.toISOString()).toBe('2026-09-19T07:32:00.000Z')
  })

  it('is stable across calls', () => {
    expect(demoNow().getTime()).toBe(demoNow().getTime())
  })

  it('uses the current clock when real APIs are enabled', () => {
    settings.useMockApi = false
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-10T13:40:00Z'))

    expect(demoNow().toISOString()).toBe('2026-10-10T13:40:00.000Z')
    vi.advanceTimersByTime(60_000)
    expect(demoNow().toISOString()).toBe('2026-10-10T13:41:00.000Z')
  })
})
