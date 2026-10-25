import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ManagerMissionStopFlow } from '../components/ManagerMissionStopFlow'
import { planningApi } from '../../../api/planningApi'
import type { SafeStop } from '../../../types/planning'
import { ApiError } from '../../../../../shared/api/httpClient'

let state: SafeStop
const props = {
  missionId: 'm1',
  missionCode: 'M1',
  status: 'IN_FLIGHT',
  revision: 7,
  refreshKey: {},
  writable: true,
  draft: false,
  active: true,
  blocked: false,
  onChanged: vi.fn(),
  onCapabilitiesChanged: vi.fn(),
  onRuntimeBlocked: vi.fn(),
  onBusyChanged: vi.fn(),
  onReplacement: vi.fn(),
}
beforeEach(() => {
  state = {
    missionId: 'm1',
    status: null,
    requestedAt: null,
    confirmedAt: null,
    cleanedAt: null,
    failureReason: null,
    requiresLanding: true,
    canRequestSafeStop: true,
    canConfirmSafeStop: false,
    canCleanupSafeStop: false,
    canCancelMission: false,
  }
  vi.spyOn(planningApi, 'getSafeStop').mockImplementation(async () =>
    structuredClone(state),
  )
  vi.spyOn(planningApi, 'requestSafeStop').mockImplementation(
    async (_, request) => {
      state.status = 'REQUESTED'
      state.requestedAt = '2026-10-09T00:00:00Z'
      state.reason = request.reason
      state.canRequestSafeStop = false
      return state
    },
  )
  vi.spyOn(planningApi, 'cleanupSafeStop').mockImplementation(async () => {
    state.cleanedAt = '2026-10-09T01:00:00Z'
    state.canCancelMission = true
    return state
  })
  vi.spyOn(planningApi, 'cancelMission').mockResolvedValue(
    {} as Awaited<ReturnType<typeof planningApi.cancelMission>>,
  )
  vi.spyOn(planningApi, 'confirmSafeStop')
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  window.location.hash = '#portal/manager/orders/o'
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  window.location.hash = ''
})
async function open() {
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Hủy Mission M1',
    }),
  )
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Làm mới trạng thái' }),
    ).toBeEnabled(),
  )
}
it('requests, waits for crew, cleans up, refreshes then cancels without route change', async () => {
  render(<ManagerMissionStopFlow {...props} />)
  expect(screen.queryByText('Dừng Mission an toàn')).not.toBeInTheDocument()
  await open()
  expect(screen.getByRole('region', { name: 'Dừng Mission M1' })).toHaveFocus()
  fireEvent.change(screen.getByLabelText('Lý do dừng / hủy Mission'), {
    target: { value: 'Thời tiết' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu dừng an toàn' }))
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: 'Yêu cầu dừng an toàn',
    }),
  )
  await screen.findByText('Đã yêu cầu dừng')
  expect(planningApi.requestSafeStop).toHaveBeenCalledWith('m1', {
    expectedPlanRevision: 7,
    reason: 'Thời tiết',
  })
  expect(
    screen.queryByRole('button', { name: /Xác nhận.*an toàn/ }),
  ).not.toBeInTheDocument()
  state.status = 'IN_PROGRESS'
  state.confirmedAt = '2026-10-09T00:30:00Z'
  state.canCleanupSafeStop = true
  fireEvent.click(screen.getByRole('button', { name: 'Làm mới trạng thái' }))
  fireEvent.click(
    await screen.findByRole('button', { name: 'Giải phóng tài nguyên' }),
  )
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: 'Giải phóng tài nguyên',
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Hủy Mission' }))
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: 'Hủy Mission',
    }),
  )
  await waitFor(() =>
    expect(planningApi.cancelMission).toHaveBeenCalledWith('m1', {
      expectedPlanRevision: 7,
      reason: 'Thời tiết',
    }),
  )
  expect(planningApi.cleanupSafeStop).toHaveBeenCalledWith('m1')
  expect(planningApi.confirmSafeStop).not.toHaveBeenCalled()
  expect(props.onChanged).toHaveBeenCalledTimes(4)
  expect(window.location.hash).toBe('#portal/manager/orders/o')
})
it('keeps immediate cancellation free of safe-stop steps when eligible', async () => {
  state.canCancelMission = true
  state.status = 'READY_FOR_CANCELLATION'
  state.requestedAt = '2026-10-10T00:00:00Z'
  render(<ManagerMissionStopFlow {...props} />)
  await open()
  expect(
    screen.queryByRole('button', { name: 'Yêu cầu dừng an toàn' }),
  ).not.toBeInTheDocument()
})
it.each(['COMPLETED', 'CANCELLED'])(
  'hides controls for %s even with stale positive capabilities',
  async (status) => {
    render(<ManagerMissionStopFlow {...props} status={status} />)
    await waitFor(() =>
      expect(props.onCapabilitiesChanged).toHaveBeenCalledWith('m1', false),
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  },
)
it('fails closed for missing capabilities', async () => {
  state = { missionId: 'm1', status: 'REQUESTED' } as SafeStop
  render(<ManagerMissionStopFlow {...props} />)
  await waitFor(() =>
    expect(props.onCapabilitiesChanged).toHaveBeenCalledWith('m1', false),
  )
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
it('returns keyboard focus to the initiating action after closing the inline flow', async () => {
  render(<ManagerMissionStopFlow {...props} />)
  await open()
  expect(screen.getByRole('region', { name: 'Dừng Mission M1' })).toHaveFocus()
  fireEvent.click(screen.getByRole('button', { name: 'Đóng bảng thao tác' }))
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Hủy Mission M1' }),
    ).toHaveFocus(),
  )
})
it('fails closed when capability loading fails', async () => {
  vi.mocked(planningApi.getSafeStop).mockRejectedValue(
    new Error('private infrastructure detail'),
  )
  render(<ManagerMissionStopFlow {...props} />)
  await waitFor(() =>
    expect(props.onCapabilitiesChanged).toHaveBeenCalledWith('m1', false),
  )
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(
    screen.queryByText('private infrastructure detail'),
  ).not.toBeInTheDocument()
})
it('offers cleanup only by capability, including a FAILED Mission', async () => {
  state.status = 'READY_FOR_CANCELLATION'
  state.canRequestSafeStop = false
  state.canCleanupSafeStop = true
  render(<ManagerMissionStopFlow {...props} status="FAILED" />)
  await open()
  expect(
    screen.getByRole('button', { name: 'Giải phóng tài nguyên' }),
  ).toBeEnabled()
  expect(
    screen.queryByRole('button', { name: 'Hủy Mission' }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /Xác nhận.*an toàn/ }),
  ).not.toBeInTheDocument()
})
it('localizes errors and reloads without inventing a local transition or retrying', async () => {
  vi.mocked(planningApi.requestSafeStop).mockRejectedValue(
    new ApiError('MISSION_SAFE_STOP_NOT_READY', {
      status: 409,
      code: 'MISSION_SAFE_STOP_NOT_READY',
      method: 'POST',
      path: '/safe-stop',
    }),
  )
  render(<ManagerMissionStopFlow {...props} />)
  await open()
  fireEvent.change(screen.getByLabelText('Lý do dừng / hủy Mission'), {
    target: { value: 'Dừng' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu dừng an toàn' }))
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: 'Yêu cầu dừng an toàn',
    }),
  )
  await screen.findByText(/Mission chưa ở trạng thái an toàn/)
  expect(
    screen.queryByText('MISSION_SAFE_STOP_NOT_READY'),
  ).not.toBeInTheDocument()
  expect(state.status).toBeNull()
  expect(planningApi.requestSafeStop).toHaveBeenCalledTimes(1)
})
it('uses the exact Mission identity and rejects a mismatched response', async () => {
  const { rerender } = render(<ManagerMissionStopFlow {...props} key="m1" />)
  await open()
  rerender(
    <ManagerMissionStopFlow
      {...props}
      key="m2"
      missionId="m2"
      missionCode="M2"
    />,
  )
  await waitFor(() =>
    expect(planningApi.getSafeStop).toHaveBeenCalledWith(
      'm2',
      expect.any(AbortSignal),
    ),
  )
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(planningApi.requestSafeStop).not.toHaveBeenCalled()
})

it.each([
  ['REQUESTED', null, null, 'Đã yêu cầu dừng', null],
  ['IN_PROGRESS', null, null, 'Đang xử lý', null],
  [
    'IN_PROGRESS',
    '2026-10-10T01:00:00Z',
    null,
    'Đã xác nhận an toàn',
    'Giải phóng tài nguyên',
  ],
  [
    'READY_FOR_CANCELLATION',
    '2026-10-10T01:00:00Z',
    '2026-10-10T02:00:00Z',
    'Sẵn sàng hủy',
    'Hủy Mission',
  ],
  ['FAILED', null, null, 'Cần xử lý lại', null],
] as const)(
  'presents phase %s with one authorized next action',
  async (status, confirmedAt, cleanedAt, label, action) => {
    state = {
      ...state,
      status,
      requestedAt: '2026-10-10T00:00:00Z',
      confirmedAt,
      cleanedAt,
      reason: 'Thời tiết xấu',
      failureReason: status === 'FAILED' ? 'PRIVATE_ERROR' : null,
      // Request/confirm capabilities can remain true for idempotent replay. Do not offer replay controls.
      canRequestSafeStop: true,
      canConfirmSafeStop: true,
      canCleanupSafeStop:
        action === 'Giải phóng tài nguyên' || Boolean(cleanedAt),
      canCancelMission: action === 'Hủy Mission',
    }
    render(<ManagerMissionStopFlow {...props} />)
    await open()
    await screen.findByText(label)
    const region = screen.getByRole('region', { name: 'Dừng Mission M1' })
    const primary = region.querySelectorAll('.mission-stop__actions button')
    expect(primary).toHaveLength(action ? 1 : 0)
    if (action)
      expect(within(region).getByRole('button', { name: action })).toBeEnabled()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('Thời tiết xấu')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Xác nhận.*an toàn/ }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('PRIVATE_ERROR')).not.toBeInTheDocument()
  },
)
it('does not require crew confirmation when the cleanup capability explicitly allows it', async () => {
  state = {
    ...state,
    status: 'REQUESTED',
    requestedAt: '2026-10-10T00:00:00Z',
    canRequestSafeStop: true,
    canCleanupSafeStop: true,
    requiresLanding: false,
  }
  render(<ManagerMissionStopFlow {...props} />)
  await open()
  expect(
    screen.getByRole('button', { name: 'Giải phóng tài nguyên' }),
  ).toBeEnabled()
  expect(
    screen.queryByRole('button', { name: 'Yêu cầu dừng an toàn' }),
  ).not.toBeInTheDocument()
})
it('refreshes all parent state and removes stale cleanup eligibility after an error', async () => {
  state = {
    ...state,
    status: 'IN_PROGRESS',
    confirmedAt: '2026-10-10T01:00:00Z',
    canRequestSafeStop: false,
    canCleanupSafeStop: true,
  }
  vi.mocked(planningApi.cleanupSafeStop).mockImplementation(async () => {
    state.canCleanupSafeStop = false
    throw new ApiError('private diagnostic', {
      status: 409,
      code: 'MISSION_SAFE_STOP_NOT_READY',
      method: 'POST',
      path: '/cleanup',
    })
  })
  render(<ManagerMissionStopFlow {...props} />)
  await open()
  fireEvent.click(screen.getByRole('button', { name: 'Giải phóng tài nguyên' }))
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: 'Giải phóng tài nguyên',
    }),
  )
  await screen.findByText(/Mission chưa ở trạng thái an toàn/)
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Giải phóng tài nguyên' }),
    ).not.toBeInTheDocument(),
  )
  expect(props.onChanged).toHaveBeenCalledTimes(1)
  expect(planningApi.cancelMission).not.toHaveBeenCalled()
})
it('uses the persisted read-only reason for cancellation after reopening', async () => {
  state = {
    ...state,
    status: 'READY_FOR_CANCELLATION',
    requestedAt: '2026-10-10T00:00:00Z',
    cleanedAt: '2026-10-10T02:00:00Z',
    reason: 'Lý do đã gửi',
    canCancelMission: true,
  }
  render(<ManagerMissionStopFlow {...props} />)
  await open()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Hủy Mission' }))
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: 'Hủy Mission',
    }),
  )
  await waitFor(() =>
    expect(planningApi.cancelMission).toHaveBeenCalledWith('m1', {
      expectedPlanRevision: 7,
      reason: 'Lý do đã gửi',
    }),
  )
})
