import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useApiQuery } from './useApiQuery'

describe('useApiQuery', () => {
  it('starts loading and resolves with data', async () => {
    const fn = vi.fn(async () => ({ value: 42 }))
    const { result } = renderHook(() => useApiQuery(fn, []))

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toEqual({ value: 42 })
    expect(result.current.error).toBeUndefined()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('exposes the rejection as error', async () => {
    const fn = vi.fn(async () => {
      throw new Error('boom')
    })
    const { result } = renderHook(() => useApiQuery(fn, []))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.data).toBeUndefined()
  })

  it('re-runs fn when deps change', async () => {
    const fn = vi.fn(async (signal: AbortSignal) => {
      void signal
      return 'ok'
    })
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useApiQuery(fn, [id]),
      { initialProps: { id: 'a' } },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fn).toHaveBeenCalledTimes(1)

    rerender({ id: 'b' })
    await waitFor(() => expect(fn).toHaveBeenCalledTimes(2))
  })

  it('reload() triggers another call with the same deps', async () => {
    const fn = vi.fn(async () => 'ok')
    const { result } = renderHook(() => useApiQuery(fn, []))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fn).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.reload()
    })

    await waitFor(() => expect(fn).toHaveBeenCalledTimes(2))
  })

  it('preserves data identity when refreshed data is equivalent', async () => {
    const fn = vi.fn(async () => [{ id: 'staff-1', name: 'Pilot' }])
    const equalById = (
      previous: Array<{ id: string }>,
      next: Array<{ id: string }>,
    ) =>
      previous.length === next.length &&
      previous.every((item, index) => item.id === next[index]?.id)
    const { result } = renderHook(() => useApiQuery(fn, [], equalById))

    await waitFor(() => expect(result.current.loading).toBe(false))
    const initialData = result.current.data

    act(() => result.current.reload())
    await waitFor(() => expect(fn).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toBe(initialData)
  })

  it('drops a stale response when deps change before the first request resolves', async () => {
    let resolveFirst: (value: string) => void = () => {}
    const first = new Promise<string>((resolve) => {
      resolveFirst = resolve
    })
    const fn = vi
      .fn()
      .mockImplementationOnce(() => first)
      .mockImplementationOnce(async () => 'second')

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useApiQuery(fn, [id]),
      { initialProps: { id: 'a' } },
    )

    rerender({ id: 'b' })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe('second')

    resolveFirst('first')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(result.current.data).toBe('second')
  })

  it('does not set state after unmount when the request resolves late', async () => {
    let resolve!: (value: string) => void
    const fn = vi.fn(
      () =>
        new Promise<string>((res) => {
          resolve = res
        }),
    )
    const { result, unmount } = renderHook(() => useApiQuery(fn, []))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    unmount()
    await act(async () => {
      resolve('late')
      await Promise.resolve()
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.loading).toBe(true)
    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
