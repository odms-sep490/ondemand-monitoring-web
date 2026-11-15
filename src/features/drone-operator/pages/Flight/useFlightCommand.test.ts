// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFlightCommand } from './useFlightCommand'
import { missionApi } from '../../../mission/api/missionApi'

vi.mock('../../../mission/api/missionApi', () => ({ missionApi: { getPermissions: vi.fn() } }))
vi.mock('../../../../shared/i18n', () => ({
  defineMessages: (messages: unknown) => messages,
  getLanguage: () => 'vi',
  useI18n: () => ({ t: { status: { controllerOffline: 'Mất kết nối', commandSent: () => 'Đã gửi lệnh' } } }),
}))

type Options = Parameters<typeof useFlightCommand>[0]
const setup = () => {
  const options: Options = {
    normalFlightAllowed: true, preflightReady: true,
    mission: { id: 'mission', backendId: 'mission', serviceLabel: 'Inspection', lat: 10.8, lng: 106.7 } as Options['mission'],
    controlStatus: { missionId: 'mission', deviceId: 'device' } as Options['controlStatus'],
    drone: { id: 'device' } as Options['drone'], restrictedGpsZones: [],
    setLastCommand: vi.fn(), setBusyCommand: vi.fn(), setIsOnline: vi.fn(), onRTB: vi.fn(), onEmergency: vi.fn(),
  }
  return { options, ...renderHook(() => useFlightCommand(options)) }
}

beforeEach(() => {
  vi.mocked(missionApi.getPermissions).mockResolvedValue({ canControlFlight: true } as Awaited<ReturnType<typeof missionApi.getPermissions>>)
})
afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks() })

describe('photo capture command completion', () => {
  it('keeps capture busy and suppresses repeated clicks until the saved-photo response', async () => {
    let complete!: (response: Response) => void
    const request = vi.fn(() => new Promise<Response>((resolve) => { complete = resolve }))
    vi.stubGlobal('fetch', request)
    const { result, options } = setup()
    let first!: Promise<void>
    act(() => { first = result.current.sendCommand('photo') })
    await waitFor(() => expect(request).toHaveBeenCalledOnce())
    expect(options.setLastCommand).toHaveBeenLastCalledWith('Đang chụp ảnh...')
    expect(options.setBusyCommand).toHaveBeenLastCalledWith('photo')
    await act(() => result.current.sendCommand('photo'))
    expect(request).toHaveBeenCalledOnce()
    await act(async () => { complete(new Response(JSON.stringify({ ok: true, localMediaId: 'new' }), { status: 201 })); await first })
    expect(options.setLastCommand).toHaveBeenLastCalledWith('Đã lưu ảnh vào thư viện local')
    expect(options.setBusyCommand).toHaveBeenLastCalledWith(null)
  })

  it.each([
    ['CAMERA_FRAME_TIMEOUT', 409, 'Camera chưa cập nhật hình ảnh. Vui lòng thử chụp lại.'],
    ['CAMERA_CAPTURE_FAILED', 503, 'Không lưu được ảnh chụp. Vui lòng thử lại.'],
  ])('localizes %s and allows an explicit retry', async (code, status, message) => {
    const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, code }), { status }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 201 }))
    vi.stubGlobal('fetch', request)
    const { result, options } = setup()
    await act(() => result.current.sendCommand('photo'))
    expect(options.setLastCommand).toHaveBeenLastCalledWith(message)
    expect(options.setBusyCommand).toHaveBeenLastCalledWith(null)
    await act(() => result.current.sendCommand('photo'))
    expect(request).toHaveBeenCalledTimes(2)
    expect(options.setLastCommand).toHaveBeenLastCalledWith('Đã lưu ảnh vào thư viện local')
  })

  it('does not present a legacy queue acknowledgement as a saved photo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 202 })))
    const { result, options } = setup()
    await act(() => result.current.sendCommand('photo'))
    expect(options.setLastCommand).toHaveBeenLastCalledWith('Đã gửi lệnh')
  })

  it('still checks Mission permission before capturing', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({ canControlFlight: false } as Awaited<ReturnType<typeof missionApi.getPermissions>>)
    const request = vi.fn()
    vi.stubGlobal('fetch', request)
    const { result } = setup()
    await act(() => result.current.sendCommand('photo'))
    expect(request).not.toHaveBeenCalled()
  })
})
