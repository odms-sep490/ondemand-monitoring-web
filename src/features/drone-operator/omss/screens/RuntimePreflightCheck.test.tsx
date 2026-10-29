import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLanguage } from '../../../../shared/i18n'
import RuntimePreflightCheck from './RuntimePreflightCheck'

// This suite asserts on the screen's original (English) copy, so switch the
// i18n store to English before each test; setup.ts resets it back to 'vi'
// afterEach.
beforeEach(() => {
  setLanguage('en')
})

const readyPayload = {
  checkId: 'PF-1',
  status: 'READY',
  progress: 100,
  checks: [
    {
      key: 'PX4',
      name: 'PX4 Flight Controller',
      status: 'PASS',
      message: 'Ready for takeoff',
      critical: true,
    },
    {
      key: 'BATTERY',
      name: 'Battery',
      status: 'PASS',
      message: '87.4% sufficient for operation',
      critical: true,
    },
    {
      key: 'MEDIA',
      name: 'Media upload',
      status: 'PASS',
      message: 'Media capture pipeline ready',
      critical: false,
    },
  ],
}

const failedPayload = {
  checkId: 'PF-2',
  status: 'FAILED',
  progress: 100,
  checks: [
    {
      key: 'PX4',
      name: 'PX4 Flight Controller',
      status: 'FAIL',
      message: 'PX4 heartbeat not available',
      critical: true,
    },
    {
      key: 'BATTERY',
      name: 'Battery',
      status: 'FAIL',
      message: '18.6% too low for safe mission start',
      critical: true,
    },
  ],
}

function mockJson(payload: unknown, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(payload),
  } as Response)
}

afterEach(() => {
  vi.useRealTimers()
  cleanup()
  vi.restoreAllMocks()
})

describe('RuntimePreflightCheck', () => {
  it('keeps retrying automatically when the controller API starts late', async () => {
    let startAttempts = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/api/preflight/check')) {
        startAttempts += 1
        if (startAttempts === 1) return Promise.reject(new Error('offline'))
        return mockJson({ checkId: 'PF-LATE', status: 'CHECKING' })
      }
      return mockJson(readyPayload)
    })

    render(<RuntimePreflightCheck onReady={vi.fn()} />)

    await waitFor(() =>
      expect(
        screen.getByText(/Waiting for flight controller preflight API/i),
      ).toBeTruthy(),
    )
    expect(
      (
        screen.getByRole('button', {
          name: /ok - go to drone operator/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)

    await waitFor(
      () =>
        expect(
          (
            screen.getByRole('button', {
              name: /ok - go to drone operator/i,
            }) as HTMLButtonElement
          ).disabled,
        ).toBe(false),
      { timeout: 6500 },
    )
  }, 7500)

  it('starts preflight automatically and enables OK only when READY', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementationOnce(() =>
        mockJson({ checkId: 'PF-1', status: 'CHECKING' }),
      )
      .mockImplementation(() => mockJson(readyPayload))
    const onReady = vi.fn()

    render(<RuntimePreflightCheck onReady={onReady} />)

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8090/api/preflight/check',
      { method: 'POST' },
    )
    expect(
      (
        screen.getByRole('button', {
          name: /ok - go to drone operator/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)

    await waitFor(
      () =>
        expect(
          (
            screen.getByRole('button', {
              name: /ok - go to drone operator/i,
            }) as HTMLButtonElement
          ).disabled,
        ).toBe(false),
      { timeout: 5000 },
    )

    fireEvent.click(
      screen.getByRole('button', { name: /ok - go to drone operator/i }),
    )
    expect(onReady).toHaveBeenCalledTimes(1)
  })

  it('keeps the preflight screen open when backend telemetry is not ready', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) =>
      String(input).endsWith('/api/preflight/check')
        ? mockJson({ checkId: 'PF-READY', status: 'CHECKING' })
        : mockJson(readyPayload),
    )
    const onReady = vi
      .fn()
      .mockRejectedValueOnce(new Error('Waiting for fresh drone telemetry'))
    render(<RuntimePreflightCheck onReady={onReady} />)

    const continueButton = await screen.findByRole('button', {
      name: /ok - go to drone operator/i,
    })
    await waitFor(
      () => expect((continueButton as HTMLButtonElement).disabled).toBe(false),
      {
        timeout: 5000,
      },
    )
    fireEvent.click(continueButton)

    await waitFor(() =>
      expect(
        screen.getByText('Waiting for fresh drone telemetry'),
      ).toBeTruthy(),
    )
    expect(onReady).toHaveBeenCalledTimes(1)
    expect((continueButton as HTMLButtonElement).disabled).toBe(false)
  }, 6500)

  it('keeps OK disabled on critical failure and retries with a new check', async () => {
    let attempt = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/api/preflight/check')) {
        attempt += 1
        return mockJson({
          checkId: attempt === 1 ? 'PF-2' : 'PF-3',
          status: 'CHECKING',
        })
      }
      if (url.endsWith('/api/preflight/PF-2')) return mockJson(failedPayload)
      return mockJson(readyPayload)
    })

    render(<RuntimePreflightCheck onReady={vi.fn()} />)

    await waitFor(() =>
      expect(
        screen.getAllByText(/PX4 heartbeat not available/i).length,
      ).toBeGreaterThan(0),
    )
    expect(
      (
        screen.getByRole('button', {
          name: /ok - go to drone operator/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /retry failed checks/i }),
      )
    })

    await waitFor(
      () =>
        expect(
          (
            screen.getByRole('button', {
              name: /ok - go to drone operator/i,
            }) as HTMLButtonElement
          ).disabled,
        ).toBe(false),
      { timeout: 5000 },
    )
  }, 6500)
})
