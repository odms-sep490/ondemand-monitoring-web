import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

import { ToastProvider, useToast } from '../Toast'

function Trigger() {
  const toast = useToast()
  return (
    <>
      <button onClick={() => toast.success('Saved ok')}>ok</button>
      <button onClick={() => toast.error('Boom')}>fail</button>
    </>
  )
}

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('is a no-op without a provider', () => {
    render(<Trigger />)
    fireEvent.click(screen.getByText('ok'))
    expect(screen.queryByText('Saved ok')).toBeNull()
  })

  it('shows a toast and auto-hides after 4s', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('ok'))
    expect(screen.getByText('Saved ok')).toBeTruthy()
    act(() => {
      vi.advanceTimersByTime(4100)
    })
    expect(screen.queryByText('Saved ok')).toBeNull()
  })

  it('pauses on hover', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('ok'))
    const toast = screen.getByText('Saved ok').closest('.ui-toast') as HTMLElement
    fireEvent.mouseEnter(toast)
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(screen.getByText('Saved ok')).toBeTruthy()
    fireEvent.mouseLeave(toast)
    act(() => {
      vi.advanceTimersByTime(4100)
    })
    expect(screen.queryByText('Saved ok')).toBeNull()
  })

  it('closes manually and uses assertive live region for errors', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('fail'))
    const alert = screen.getByRole('alert')
    expect(alert.getAttribute('aria-live')).toBe('assertive')
    fireEvent.click(screen.getByRole('button', { name: /Đóng thông báo|Dismiss/ }))
    expect(screen.queryByText('Boom')).toBeNull()
  })
})
