import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useJourneyPlayback } from './useJourneyPlayback'

describe('useJourneyPlayback', () => {
  afterEach(() => vi.useRealTimers())

  it('keeps remaining stage time when paused and resumed', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useJourneyPlayback(false))

    act(() => result.current.setInView(true))
    act(() => vi.advanceTimersByTime(1000))
    act(() => result.current.hold())
    act(() => vi.advanceTimersByTime(5000))
    expect(result.current.stage).toBe('request')

    act(() => result.current.release())
    act(() => vi.advanceTimersByTime(4599))
    expect(result.current.stage).toBe('request')
    act(() => vi.advanceTimersByTime(1))
    expect(result.current.stage).toBe('scope')
  })

  it('preserves remaining time while outside the viewport and while the tab is hidden', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useJourneyPlayback(false))

    act(() => result.current.setInView(true))
    act(() => vi.advanceTimersByTime(500))
    act(() => result.current.setInView(false))
    act(() => vi.advanceTimersByTime(5000))
    expect(result.current.stage).toBe('request')

    act(() => result.current.setInView(true))
    act(() => vi.advanceTimersByTime(400))
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    act(() => vi.advanceTimersByTime(5000))
    expect(result.current.stage).toBe('request')

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    act(() => vi.advanceTimersByTime(4699))
    expect(result.current.stage).toBe('request')
    act(() => vi.advanceTimersByTime(1))
    expect(result.current.stage).toBe('scope')
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
  })

  it('restarts the dwell time on selection and loops from report back to request', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useJourneyPlayback(false))

    act(() => result.current.select('inspection'))
    expect(result.current.stage).toBe('inspection')
    expect(result.current.intent).toBe('playing')

    act(() => result.current.select('request'))
    act(() => result.current.setInView(true))
    expect(result.current.isPlaying).toBe(true)
    await act(async () => vi.advanceTimersByTimeAsync(5600))
    expect(result.current.stage).toBe('scope')
    await act(async () => vi.advanceTimersByTimeAsync(5600))
    expect(result.current.stage).toBe('inspection')
    await act(async () => vi.advanceTimersByTimeAsync(5600))
    expect(result.current.stage).toBe('report')
    await act(async () => vi.advanceTimersByTimeAsync(5600))
    expect(result.current.stage).toBe('request')
    expect(result.current.intent).toBe('playing')
  })

  it('renders a static report when reduced motion is enabled', () => {
    const { result } = renderHook(() => useJourneyPlayback(true))
    expect(result.current.stage).toBe('report')
    expect(result.current.intent).toBe('paused')
  })
})
