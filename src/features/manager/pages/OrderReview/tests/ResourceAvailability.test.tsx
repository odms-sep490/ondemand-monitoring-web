import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { LiveDispatchPage } from '../../../components/common/LiveDispatchPage'
import type { OrderDispatchContext } from '../../../components/common/liveDispatchTypes'
import { missionApi } from '../../../../mission/api/missionApi'
import type { Mission } from '../../../../mission/types/mission'
import { operatorApi } from '../../../../staff/api/operatorApi'
import { droneApi } from '../../../../staff/api/droneApi'
import { ApiError } from '../../../../../shared/api/httpClient'
import { planningError } from '../../../lib/planningErrors'

const roles = ['PILOT', 'OPERATOR', 'MAINTAINER', 'INSPECTOR'] as const
const people = roles.map((_, i) => ({
  id: 's' + i,
  fullName: 'Staff ' + i,
  email: i + '@test.local',
}))
const devices = [
  { id: 'd1', label: 'Drone 1' },
  { id: 'd2', label: 'Drone 2' },
]
const mission = {
  id: 'm1',
  orderId: 'o',
  missionCode: 'M1',
  status: 'RESOURCE_ASSIGNING',
  scheduledStartAt: '2026-10-10T03:00:00Z',
  scheduledEndAt: '2026-10-10T04:00:00Z',
} as Mission
function context(
  overrides: Partial<OrderDispatchContext> = {},
): OrderDispatchContext {
  return {
    orderId: 'o',
    missionScoped: false,
    returnLabel: 'Về Order',
    initialStep: 'confirm',
    canAssign: true,
    missionSelection: null,
    onMissionNext: () => true,
    onReturn: vi.fn(),
    onAssigned: vi.fn(),
    onChanged: vi.fn(),
    onDraftState: vi.fn(),
    initialDevices: ['d1', 'd2'],
    initialStaff: Object.fromEntries(roles.map((role, i) => [role, ['s' + i]])),
    assignedPeople: people,
    assignedDevices: devices,
    scheduledStartAt: mission.scheduledStartAt,
    scheduledEndAt: mission.scheduledEndAt,
    ...overrides,
  }
}
beforeEach(() => {
  vi.spyOn(missionApi, 'getMissionById').mockResolvedValue(mission)
  vi.spyOn(operatorApi, 'getAvailable').mockResolvedValue(people)
  vi.spyOn(droneApi, 'getAvailable').mockResolvedValue(devices)
  vi.spyOn(missionApi, 'assignResources').mockResolvedValue(mission)
})
afterEach(() => vi.restoreAllMocks())

it('uses exact Mission availability, keeps own assignments, and shows only returned options', async () => {
  render(<LiveDispatchPage missionId="m1" orderContext={context()} />)
  expect(await screen.findByRole('button', { name: 'Phân công' })).toBeEnabled()
  expect(operatorApi.getAvailable).toHaveBeenCalledWith('m1')
  expect(droneApi.getAvailable).toHaveBeenCalledWith('m1')
  fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }))
  fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }))
  fireEvent.click(screen.getByRole('button', { name: /Staff 0.*Sẵn sàng/ }))
  expect(
    screen.getByPlaceholderText('Tìm theo tên hoặc email...'),
  ).toBeInTheDocument()
  expect(screen.queryByText('Unavailable sibling')).not.toBeInTheDocument()
})

it('refreshes staff conflict, removes only unavailable selections and returns to staff', async () => {
  vi.mocked(operatorApi.getAvailable)
    .mockResolvedValueOnce(people)
    .mockResolvedValue(people.slice(1))
  vi.mocked(missionApi.assignResources).mockRejectedValue(
    new ApiError('Resource is reserved during the requested interval', {
      status: 409,
      code: 'RESOURCE_TIME_CONFLICT',
      method: 'POST',
      path: '/api/missions/m1/assign-staff',
    }),
  )
  render(<LiveDispatchPage missionId="m1" orderContext={context()} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Phân công' }))
  expect(
    await screen.findByText(/Nhân sự không còn khả dụng/),
  ).toBeInTheDocument()
  expect(screen.getByLabelText('Chọn nhân sự cho Phi công')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Staff 1.*Sẵn sàng/ }),
  ).toHaveTextContent('Staff 1')
  expect(
    screen.queryByText('Resource is reserved during the requested interval'),
  ).not.toBeInTheDocument()
  expect(droneApi.getAvailable).toHaveBeenCalledTimes(2)
  expect(missionApi.getMissionById).toHaveBeenCalledTimes(2)
  expect(missionApi.assignResources).toHaveBeenCalledTimes(1)
})

it('refreshes device conflict, retains valid devices/crew and returns to device', async () => {
  vi.mocked(droneApi.getAvailable)
    .mockResolvedValueOnce(devices)
    .mockResolvedValue([devices[1]])
  vi.mocked(missionApi.assignResources).mockRejectedValue(
    new ApiError('Resource is reserved during the requested interval', {
      status: 409,
      code: 'RESOURCE_TIME_CONFLICT',
      method: 'POST',
      path: '/api/missions/m1/assign-device',
    }),
  )
  render(<LiveDispatchPage missionId="m1" orderContext={context()} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Phân công' }))
  expect(
    await screen.findByText(/Thiết bị không còn khả dụng/),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Thêm thiết bị/ }))
  expect(
    screen.queryByRole('option', { name: /Drone 1/ }),
  ).not.toBeInTheDocument()
  expect(screen.getByRole('option', { name: /Drone 2/ })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }))
  expect(
    screen.getByRole('button', { name: /Staff 0.*Sẵn sàng/ }),
  ).toHaveTextContent('Staff 0')
  expect(missionApi.assignResources).toHaveBeenCalledTimes(1)
})

it('keeps the exact failed device step even when another staff option also became unavailable', async () => {
  vi.mocked(droneApi.getAvailable)
    .mockResolvedValueOnce(devices)
    .mockResolvedValue([devices[1]])
  vi.mocked(operatorApi.getAvailable)
    .mockResolvedValueOnce(people)
    .mockResolvedValue(people.slice(1))
  vi.mocked(missionApi.assignResources).mockRejectedValue(
    new ApiError('Resource is reserved during the requested interval', {
      status: 409,
      code: 'RESOURCE_TIME_CONFLICT',
      method: 'POST',
      path: '/api/missions/m1/assign-device',
    }),
  )
  render(<LiveDispatchPage missionId="m1" orderContext={context()} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Phân công' }))
  await screen.findByText(/Thiết bị không còn khả dụng/)
})

it('shows explanatory loading and empty states without stale options', async () => {
  let resolve!: (value: typeof people) => void
  vi.mocked(operatorApi.getAvailable).mockReturnValue(
    new Promise((r) => {
      resolve = r
    }),
  )
  vi.mocked(droneApi.getAvailable).mockResolvedValue([])
  render(
    <LiveDispatchPage
      missionId="m1"
      orderContext={context({
        initialStep: 'staff',
        initialDevices: [],
        initialStaff: {},
      })}
    />,
  )
  await waitFor(() =>
    expect(operatorApi.getAvailable).toHaveBeenCalledWith('m1'),
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    'Đang kiểm tra nhân sự khả dụng...',
  )
  expect(
    screen.queryByLabelText('Chọn nhân sự cho Phi công'),
  ).not.toBeInTheDocument()
  resolve([])
  expect(
    await screen.findByText(
      'Không có nhân sự phù hợp trong khung giờ nhiệm vụ này.',
    ),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }))
  expect(
    screen.getByText('Không có thiết bị khả dụng trong khung giờ nhiệm vụ này.'),
  ).toBeInTheDocument()
})

it('revalidates selections after schedule changes and warns on a now-invalid assignment', async () => {
  const props = context()
  const view = render(<LiveDispatchPage missionId="m1" orderContext={props} />)
  await screen.findByRole('button', { name: 'Phân công' })
  const scheduledEndAt = '2026-10-10T05:00:00Z'
  vi.mocked(missionApi.getMissionById).mockResolvedValue({
    ...mission,
    scheduledEndAt,
  })
  vi.mocked(droneApi.getAvailable).mockResolvedValue([devices[1]])
  view.rerender(
    <LiveDispatchPage
      missionId="m1"
      orderContext={{ ...props, scheduledEndAt }}
    />,
  )
  expect(
    await screen.findByText(/Thiết bị không còn khả dụng/),
  ).toBeInTheDocument()
  expect(droneApi.getAvailable).toHaveBeenCalledTimes(2)
  expect(
    screen.queryByRole('option', { name: /Drone 1/ }),
  ).not.toBeInTheDocument()
})

it('shows device availability loading without exposing stale options', async () => {
  vi.mocked(droneApi.getAvailable).mockReturnValue(new Promise(() => {}))
  render(
    <LiveDispatchPage
      missionId="m1"
      orderContext={context({ initialStep: 'device' })}
    />,
  )
  await waitFor(() => expect(droneApi.getAvailable).toHaveBeenCalledWith('m1'))
  expect(screen.getByRole('status')).toHaveTextContent(
    'Đang kiểm tra thiết bị khả dụng...',
  )
  expect(screen.queryByRole('option')).not.toBeInTheDocument()
  expect(screen.queryByText('Drone 1')).not.toBeInTheDocument()
})

it('switching Mission clears local selection and cannot publish a late sibling response', async () => {
  let resolve!: (value: typeof people) => void
  vi.mocked(operatorApi.getAvailable).mockImplementation((id) =>
    id === 'm1'
      ? new Promise((r) => {
          resolve = r
        })
      : Promise.resolve([
          { id: 's-new', fullName: 'Sibling staff', email: 's@local.test' },
        ]),
  )
  vi.mocked(missionApi.getMissionById).mockImplementation(async (id) => ({
    ...mission,
    id,
  }))
  const view = render(
    <LiveDispatchPage missionId="m1" orderContext={context()} />,
  )
  await waitFor(() =>
    expect(operatorApi.getAvailable).toHaveBeenCalledWith('m1'),
  )
  view.rerender(
    <LiveDispatchPage
      missionId="m2"
      orderContext={context({
        initialDevices: [],
        initialStaff: {},
        initialStep: 'staff',
      })}
    />,
  )
  await screen.findByLabelText('Chọn nhân sự cho Phi công')
  resolve(people)
  fireEvent.click(screen.getByLabelText('Chọn nhân sự cho Phi công'))
  const picker = screen
    .getByPlaceholderText('Tìm theo tên hoặc email...')
    .closest('div[style*="position: absolute"]')!
  expect(
    within(picker as HTMLElement).getByRole('button', {
      name: /Sibling staff/,
    }),
  ).toBeInTheDocument()
  expect(
    within(picker as HTMLElement).queryByRole('button', { name: /Staff 0/ }),
  ).not.toBeInTheDocument()
})

it('does not issue availability queries without a valid persisted interval', async () => {
  vi.mocked(missionApi.getMissionById).mockResolvedValue({
    ...mission,
    scheduledEndAt: undefined,
  })
  render(<LiveDispatchPage missionId="m1" />)
  expect(
    await screen.findByText(/Cần có lịch bắt đầu và kết thúc nhiệm vụ hợp lệ/),
  ).toBeInTheDocument()
  expect(droneApi.getAvailable).not.toHaveBeenCalled()
  expect(operatorApi.getAvailable).not.toHaveBeenCalled()
})

it('localizes legacy reservation errors without exposing the server message', () => {
  expect(
    planningError(
      new Error('Resource is reserved during the requested interval'),
    ),
  ).toContain('trùng lịch')
})
