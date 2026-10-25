import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiError } from '../../../../../shared/api/httpClient'
import { planningApi } from '../../../api/planningApi'
import type { SafeStop } from '../../../types/planning'
import { SafeStopPanel } from '../SafeStopPanel'

let state: SafeStop
const onChanged = vi.fn()
beforeEach(() => {
  state = {
    missionId: 'm1',
    status: null,
    requestedAt: null,
    confirmedAt: null,
    cleanedAt: null,
    failureReason: null,
    requiresLanding: true,
    canConfirmSafeStop: false,
  }
  vi.spyOn(planningApi, 'getSafeStop').mockImplementation(async () =>
    structuredClone(state),
  )
  vi.spyOn(planningApi, 'confirmSafeStop').mockImplementation(
    async (_, confirmation) => {
      state = {
        ...state,
        status: 'IN_PROGRESS',
        confirmedAt: '2026-10-10T01:00:00Z',
        confirmation,
      }
      return state
    },
  )
  vi.spyOn(planningApi, 'requestSafeStop')
  vi.spyOn(planningApi, 'cleanupSafeStop')
  vi.spyOn(planningApi, 'cancelMission')
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})
it('stays hidden for Staff until a safe-stop request exists', async () => {
  const view = render(
    <SafeStopPanel
      missionId="m1"
      hideWhenIdle
      onChanged={onChanged}
    />,
  )
  await waitFor(() => expect(planningApi.getSafeStop).toHaveBeenCalled())
  expect(
    screen.queryByText('Dừng Mission an toàn'),
  ).not.toBeInTheDocument()

  view.unmount()
  state = { ...state, status: 'REQUESTED', canConfirmSafeStop: true }
  render(
    <SafeStopPanel
      missionId="m1"
      hideWhenIdle
      onChanged={onChanged}
    />,
  )
  expect(await screen.findByText('Đã yêu cầu dừng')).toBeInTheDocument()
})
it.each([
  [null, null, null, 'Chưa có yêu cầu'],
  ['REQUESTED', null, null, 'Đã yêu cầu dừng'],
  ['IN_PROGRESS', null, null, 'Đang xử lý'],
  ['IN_PROGRESS', '2026-10-10T01:00:00Z', null, 'Đã xác nhận an toàn'],
  [
    'READY_FOR_CANCELLATION',
    '2026-10-10T01:00:00Z',
    '2026-10-10T02:00:00Z',
    'Đã hoàn tất dừng an toàn',
  ],
  ['FAILED', null, null, 'Cần xử lý lại'],
] as const)(
  'localizes Staff phase %s / %s / %s',
  async (status, confirmedAt, cleanedAt, label) => {
    state = {
      ...state,
      status,
      confirmedAt,
      cleanedAt,
      canRequestSafeStop: true,
      canCleanupSafeStop: true,
      canCancelMission: true,
    }
    render(<SafeStopPanel missionId="m1" onChanged={onChanged} />)
    await screen.findByText(label)
    expect(
      screen.queryByRole('button', { name: 'Giải phóng tài nguyên' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Hủy Mission' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Yêu cầu dừng an toàn' }),
    ).not.toBeInTheDocument()
    if (status) expect(screen.queryByText(status)).not.toBeInTheDocument()
  },
)
it('requires an explicit capability, note and safety attestation, then re-queries and removes replay control', async () => {
  state = {
    ...state,
    status: 'REQUESTED',
    requestedAt: '2026-10-10T00:00:00Z',
    canConfirmSafeStop: true,
  }
  render(<SafeStopPanel missionId="m1" onChanged={onChanged} />)
  const button = await screen.findByRole('button', {
    name: 'Xác nhận đã an toàn',
  })
  expect(button).toBeDisabled()
  fireEvent.change(screen.getByLabelText('Ghi nhận an toàn'), {
    target: { value: 'Đã hạ cánh và kết thúc điều khiển' },
  })
  expect(button).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(button)
  await screen.findByText('Đã xác nhận an toàn')
  expect(planningApi.confirmSafeStop).toHaveBeenCalledWith(
    'm1',
    'Đã hạ cánh và kết thúc điều khiển',
  )
  expect(planningApi.getSafeStop).toHaveBeenCalledTimes(2)
  expect(onChanged).toHaveBeenCalledTimes(1)
  expect(
    screen.getByText('Đang chờ Manager giải phóng tài nguyên.'),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Xác nhận đã an toàn' }),
  ).not.toBeInTheDocument()
  expect(planningApi.requestSafeStop).not.toHaveBeenCalled()
  expect(planningApi.cleanupSafeStop).not.toHaveBeenCalled()
  expect(planningApi.cancelMission).not.toHaveBeenCalled()
})
it.each([false, undefined])(
  'does not infer Staff permission when capability is %s',
  async (capability) => {
    state = { ...state, status: 'REQUESTED', canConfirmSafeStop: capability }
    render(<SafeStopPanel missionId="m1" onChanged={onChanged} />)
    await screen.findByText('Đã yêu cầu dừng')
    expect(
      screen.queryByRole('button', { name: 'Xác nhận đã an toàn' }),
    ).not.toBeInTheDocument()
  },
)
it('refreshes status and parent Mission without mutating', async () => {
  render(<SafeStopPanel missionId="m1" onChanged={onChanged} />)
  await screen.findByText('Chưa có yêu cầu')
  state = { ...state, status: 'REQUESTED', canConfirmSafeStop: true }
  fireEvent.click(screen.getByRole('button', { name: 'Làm mới trạng thái' }))
  await screen.findByText('Đã yêu cầu dừng')
  expect(onChanged).toHaveBeenCalledTimes(1)
  expect(planningApi.confirmSafeStop).not.toHaveBeenCalled()
})
it('fails closed for another Mission and does not publish foreign capabilities', async () => {
  state = {
    ...state,
    missionId: 'm2',
    status: 'REQUESTED',
    canConfirmSafeStop: true,
    canCancelMission: true,
  }
  const onCapabilitiesChanged = vi.fn()
  render(
    <SafeStopPanel
      missionId="m1"
      onChanged={onChanged}
      onCapabilitiesChanged={onCapabilitiesChanged}
    />,
  )
  await screen.findByText(/Không thể xác minh trạng thái/)
  expect(
    screen.queryByRole('button', { name: 'Xác nhận đã an toàn' }),
  ).not.toBeInTheDocument()
  expect(onCapabilitiesChanged).not.toHaveBeenCalledWith('m1', true)
})
it('localizes failure diagnostics and never prints raw actor IDs or exception text', async () => {
  state = {
    ...state,
    status: 'FAILED',
    failureReason: 'INTERNAL_SESSION_ERROR: secret detail',
    requestedBy: 'raw-actor-id',
    confirmedBy: 'raw-crew-id',
  }
  render(<SafeStopPanel missionId="m1" onChanged={onChanged} />)
  await screen.findByText('Cần xử lý lại')
  expect(
    screen.queryByText(/INTERNAL_SESSION_ERROR|raw-actor-id|raw-crew-id/),
  ).not.toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Chưa hoàn tất dừng an toàn',
  )
})
it('keeps actions disabled while confirming and reloads after a rejected command', async () => {
  state = { ...state, status: 'REQUESTED', canConfirmSafeStop: true }
  let reject: (error: unknown) => void = () => {}
  vi.mocked(planningApi.confirmSafeStop).mockImplementation(
    () =>
      new Promise((_, fail) => {
        reject = fail
      }),
  )
  render(<SafeStopPanel missionId="m1" onChanged={onChanged} />)
  const button = await screen.findByRole('button', {
    name: 'Xác nhận đã an toàn',
  })
  fireEvent.change(screen.getByLabelText('Ghi nhận an toàn'), {
    target: { value: 'An toàn' },
  })
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(button)
  expect(button).toBeDisabled()
  expect(
    screen.getByRole('button', { name: 'Làm mới trạng thái' }),
  ).toBeDisabled()
  state.canConfirmSafeStop = false
  reject(
    new ApiError('raw diagnostic', {
      status: 409,
      code: 'MISSION_SAFE_STOP_NOT_READY',
      method: 'POST',
      path: '/confirm',
    }),
  )
  await screen.findByText(/Mission chưa ở trạng thái an toàn/)
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Xác nhận đã an toàn' }),
    ).not.toBeInTheDocument(),
  )
  expect(onChanged).toHaveBeenCalledTimes(1)
})
