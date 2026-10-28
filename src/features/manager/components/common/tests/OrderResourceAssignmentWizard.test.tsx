import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { OrderResourceAssignmentWizard } from '../OrderResourceAssignmentWizard'
import { planningApi } from '../../../api/planningApi'
import { ordersApi } from '../../../api/ordersApi'
import { missionApi } from '../../../../mission/api/missionApi'
import { operatorApi } from '../../../../staff/api/operatorApi'
import { droneApi } from '../../../../staff/api/droneApi'
import type { MissionResponse } from '../../../types/missions'
import type { Mission } from '../../../../mission/types/mission'
import type { ExecutionPlan, SafeStop } from '../../../types/planning'
import type { OrderDetail } from '../../../types/orders'
import { ApiError } from '../../../../../shared/api/httpClient'

let missions: MissionResponse[]
let plan: ExecutionPlan
beforeEach(() => {
  missions = ['m1', 'm2'].map(
    (id) =>
      ({
        id,
        orderId: 'o',
        missionCode: id.toUpperCase(),
        status: 'READY',
        scheduledStartAt: '2026-10-10T03:00:00Z',
        scheduledEndAt: '2026-10-10T04:00:00Z',
        staffAssignments: [],
      }) as unknown as MissionResponse,
  )
  plan = {
    orderId: 'o',
    planStatus: 'FINALIZED',
    revision: 7,
    missions: missions.map((m) => ({
      missionId: m.id,
      scopeLabel: m.missionCode,
      assignmentCount: 0,
      finalizedPlanRevision: 7,
    })),
    coverage: {
      total: 0,
      covered: 0,
      uncovered: 0,
      repeated: 0,
      coverageReady: true,
      uncoveredItemIds: [],
    },
    blockers: [],
  }
  vi.spyOn(planningApi, 'getOrderMissions').mockImplementation(async () =>
    structuredClone(missions),
  )
  vi.spyOn(planningApi, 'getExecutionPlan').mockImplementation(async () => plan)
  vi.spyOn(ordersApi, 'getOrder').mockResolvedValue({
    id: 'o',
    status: 'APPROVED',
  } as OrderDetail)
  vi.spyOn(planningApi, 'getSafeStop').mockImplementation(
    async (missionId) =>
      ({ missionId, status: null, requestedAt: null }) as SafeStop,
  )
  vi.spyOn(missionApi, 'getMissionById').mockImplementation(
    async (id) =>
      structuredClone(missions.find((m) => m.id === id)!) as unknown as Mission,
  )
  vi.spyOn(droneApi, 'getAvailable').mockResolvedValue([
    { id: 'd1', label: 'Drone 1' },
    { id: 'd2', label: 'Drone 2' },
  ])
  vi.spyOn(operatorApi, 'getAvailable').mockResolvedValue([
    { id: 's1', fullName: 'Staff 1', email: '1@local.test' },
    { id: 's2', fullName: 'Staff 2', email: '2@local.test' },
  ])
  vi.spyOn(missionApi, 'assignResources').mockImplementation(
    async (id, devices, crew) => {
      const mission = missions.find((m) => m.id === id)!
      mission.deviceId = (devices as string[])[0]
      mission.staffAssignments = Object.entries(crew).flatMap(
        ([assignedRole, ids]) =>
          (ids as string[]).map((staffId) => ({
            staffId,
            staffName: staffId === 's1' ? 'Staff 1' : 'Staff 2',
            assignedRole,
          })),
      ) as unknown as MissionResponse['staffAssignments']
      mission.status = 'READY'
      return mission as unknown as Mission
    },
  )
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  window.location.hash = '#portal/manager/orders/o'
})
afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})
async function enter(id: string) {
  fireEvent.click(
    await screen.findByRole('radio', { name: new RegExp(id.toUpperCase()) }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }))
  await waitFor(() =>
    expect(document.querySelector('.odm-or-pagehead')).toHaveTextContent(
      'Gán nguồn lực',
    ),
  )
}
function chooseStaff(name: string) {
  const picker = screen
    .getByPlaceholderText('Tìm theo tên hoặc email...')
    .closest('div[style*="position: absolute"]')!
  fireEvent.click(
    within(picker as HTMLElement).getByRole('button', {
      name: new RegExp(name),
    }),
  )
}
async function fill(id: string) {
  for (const role of ['Phi công', 'Vận hành', 'Bảo trì', 'Nghiệm thu']) {
    fireEvent.click(screen.getByLabelText('Chọn nhân sự cho ' + role))
    chooseStaff('Staff ' + id)
  }
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }))
  fireEvent.click(screen.getByLabelText('Chọn thiết bị'))
  fireEvent.click(
    screen.getByRole('option', { name: new RegExp('Drone ' + id) }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }))
}
it('reuses the staff/device/confirmation screens for M1 then M2 and returns to the same Order selector', async () => {
  render(<OrderResourceAssignmentWizard orderId="o" onClose={vi.fn()} />)
  await enter('m1')
  expect(document.querySelectorAll('.odm-or-role-card')).toHaveLength(4)
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  await fill('1')
  fireEvent.click(screen.getByRole('button', { name: 'Phân công' }))
  await screen.findByRole('region', { name: 'Chọn nhiệm vụ để phân công' })
  await waitFor(() =>
    expect(
      screen.getByRole('radio', { name: /M1/ }).closest('label'),
    ).toHaveTextContent('Đã phân công'),
  )
  expect(missionApi.assignResources).toHaveBeenCalledWith('m1', ['d1'], {
    PILOT: ['s1'],
    OPERATOR: ['s1'],
    MAINTAINER: ['s1'],
    INSPECTOR: ['s1'],
  })
  await enter('m2')
  expect(document.querySelectorAll('.odm-or-role-card.is-filled')).toHaveLength(
    0,
  )
  await fill('2')
  fireEvent.click(screen.getByRole('button', { name: 'Phân công' }))
  await screen.findByRole('region', { name: 'Chọn nhiệm vụ để phân công' })
  expect(missionApi.assignResources).toHaveBeenLastCalledWith('m2', ['d2'], {
    PILOT: ['s2'],
    OPERATOR: ['s2'],
    MAINTAINER: ['s2'],
    INSPECTOR: ['s2'],
  })
  await enter('m1')
  expect(screen.getByRole('button', { name: 'Phân công' })).toBeInTheDocument()
  expect(screen.getByText('Drone 1')).toBeInTheDocument()
  expect(screen.queryByText('Staff 2')).not.toBeInTheDocument()
  expect(window.location.hash).toBe('#portal/manager/orders/o')
}, 15_000)
it('disables unfinalized and terminal Missions without inferring the first Mission', async () => {
  missions[0].status = 'COMPLETED'
  missions[1].status = 'CANCELLED'
  missions.push({
    id: 'm3',
    orderId: 'o',
    missionCode: 'M3',
    status: 'PLANNING',
  } as unknown as MissionResponse)
  render(<OrderResourceAssignmentWizard orderId="o" onClose={vi.fn()} />)
  for (const id of ['M1', 'M2', 'M3'])
    expect(
      await screen.findByRole('radio', { name: new RegExp(id) }),
    ).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Tiếp theo' })).toBeDisabled()
  expect(missionApi.getMissionById).not.toHaveBeenCalled()
})
it('warns before discarding a Mission draft and preloads a clean sibling', async () => {
  render(<OrderResourceAssignmentWizard orderId="o" onClose={vi.fn()} />)
  await enter('m1')
  fireEvent.click(screen.getByLabelText('Chọn nhân sự cho Phi công'))
  chooseStaff('Staff 1')
  fireEvent.click(screen.getByRole('button', { name: 'Chọn nhiệm vụ khác' }))
  const dialog = await screen.findByRole('dialog', {
    name: 'Bỏ thay đổi chưa lưu?',
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy' }))
  expect(document.querySelectorAll('.odm-or-role-card.is-filled')).toHaveLength(
    1,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Chọn nhiệm vụ khác' }))
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: 'Bỏ thay đổi',
    }),
  )
  await enter('m2')
  expect(document.querySelectorAll('.odm-or-role-card.is-filled')).toHaveLength(
    0,
  )
})
it('localizes partial failure, reloads authoritative state and does not auto retry', async () => {
  vi.mocked(missionApi.assignResources).mockRejectedValue(
    new ApiError('RESOURCE_TIME_CONFLICT', {
      code: 'RESOURCE_TIME_CONFLICT',
      status: 409,
      method: 'POST',
      path: '/assign',
    }),
  )
  render(<OrderResourceAssignmentWizard orderId="o" onClose={vi.fn()} />)
  await enter('m1')
  await fill('1')
  fireEvent.click(screen.getByRole('button', { name: 'Phân công' }))
  expect(await screen.findByRole('alert')).not.toHaveTextContent(
    'RESOURCE_TIME_CONFLICT',
  )
  expect(missionApi.assignResources).toHaveBeenCalledTimes(1)
  await waitFor(() =>
    expect(planningApi.getOrderMissions).toHaveBeenCalledTimes(2),
  )
})
it('fails closed if authoritative safety state cannot be loaded', async () => {
  vi.mocked(planningApi.getSafeStop).mockRejectedValue(new Error('Unavailable'))
  render(<OrderResourceAssignmentWizard orderId="o" onClose={vi.fn()} />)
  await waitFor(() =>
    expect(screen.getByRole('radio', { name: /M1/ })).toBeDisabled(),
  )
  expect(screen.getByRole('button', { name: 'Tiếp theo' })).toBeDisabled()
})
it('refuses a Mission read response from a different Order', async () => {
  vi.mocked(missionApi.getMissionById).mockResolvedValue({
    ...missions[0],
    orderId: 'another-order',
  } as unknown as Mission)
  render(<OrderResourceAssignmentWizard orderId="o" onClose={vi.fn()} />)
  fireEvent.click(await screen.findByRole('radio', { name: /M1/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'không còn đủ điều kiện',
  )
  expect(missionApi.assignResources).not.toHaveBeenCalled()
})
it('preloads own current resources returned by scoped availability without duplicate people options', async () => {
  missions[0].deviceId = 'd1'
  missions[0].deviceCode = 'ODM-DRN-0052'
  missions[0].staffAssignments = [
    'PILOT',
    'OPERATOR',
    'MAINTAINER',
    'INSPECTOR',
  ].map((assignedRole) => ({
    staffId: 's1',
    staffName: 'Staff 1',
    assignedRole,
  })) as MissionResponse['staffAssignments']
  vi.mocked(droneApi.getAvailable).mockResolvedValue([
    { id: 'd1', label: 'ODM-DRN-0052' },
  ])
  vi.mocked(operatorApi.getAvailable).mockResolvedValue([
    { id: 's1', fullName: 'Staff 1', email: '1@local.test' },
  ])
  render(<OrderResourceAssignmentWizard orderId="o" onClose={vi.fn()} />)
  await enter('m1')
  expect(screen.getByText('ODM-DRN-0052')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Phân công' })).toBeEnabled()
})

function crew(id: string, count = 4) {
  return ['PILOT', 'OPERATOR', 'MAINTAINER', 'INSPECTOR']
    .slice(0, count)
    .map((assignedRole) => ({
      staffId: id,
      staffName: `Staff ${id === 's1' ? '1' : '2'}`,
      assignedRole,
      responseStatus: 'PENDING',
    })) as MissionResponse['staffAssignments']
}
it.each([
  ['staff', 2, false],
  ['device', 4, false],
  ['confirm', 4, true],
] as const)(
  'known Mission resumes %s without a second Mission selection',
  async (step, count, device) => {
    missions[1].staffAssignments = crew('s2', count)
    if (device) missions[1].deviceId = 'd2'
    const close = vi.fn()
    render(
      <OrderResourceAssignmentWizard
        orderId="o"
        initialMissionId="m2"
        returnLabel="Về danh sách nhiệm vụ"
        onClose={close}
      />,
    )
    await screen.findByRole('heading', { name: 'Gán nguồn lực' })
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    if (step === 'confirm')
      await screen.findByRole('button', { name: 'Phân công' })
    else
      await screen.findByText(
        {
          staff: 'Chọn đủ 4 vai trò rồi sang bước Thiết bị.',
          device: 'Chọn ít nhất một thiết bị khả dụng rồi sang bước Xác nhận.',
        }[step],
      )
    expect(missionApi.getMissionById).toHaveBeenCalledWith('m2')
    fireEvent.click(
      screen.getByRole('button', { name: 'Về danh sách nhiệm vụ' }),
    )
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1))
    expect(missionApi.assignResources).not.toHaveBeenCalled()
  },
)
it('scoped submit returns to its origin and never mutates Order/Mission completion', async () => {
  const close = vi.fn()
  render(
    <OrderResourceAssignmentWizard
      orderId="o"
      initialMissionId="m1"
      onClose={close}
    />,
  )
  await screen.findByLabelText('Chọn nhân sự cho Phi công')
  await fill('1')
  fireEvent.click(screen.getByRole('button', { name: 'Phân công' }))
  // Step 8: overview of every Mission; leaving it returns to the origin.
  await screen.findByRole('heading', { name: 'Tổng quan Mission' })
  expect(close).not.toHaveBeenCalled()
  const preparationSteps = screen.getByRole('region', { name: 'Nhiệm vụ' })
  expect(
    within(preparationSteps).getByText('Chuẩn bị').closest('li'),
  ).toHaveClass('is-current')
  expect(
    screen.queryByRole('region', { name: 'Giấy phép bay M1' }),
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp: Giấy phép bay' }))
  expect(
    await screen.findByRole('region', { name: 'Giấy phép bay M1' }),
  ).toBeInTheDocument()
  const permitSteps = screen.getByRole('region', { name: 'Nhiệm vụ' })
  expect(
    within(permitSteps).getByText('Giấy phép bay').closest('li'),
  ).toHaveClass('is-current')
  expect(screen.getByText('Chưa chọn tệp')).toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', { name: 'Hoàn tất giấy phép bay' }),
  )
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1))
  expect(missions[1].staffAssignments).toHaveLength(0)
  expect(missions[1].deviceId).toBeUndefined()
})
it('all assignments submitted provides an explicit navigation-only finish', async () => {
  vi.spyOn(planningApi, 'finalizeExecutionPlan')
  for (const mission of missions) {
    mission.staffAssignments = crew('s1')
    mission.deviceId = 'd1'
    mission.status = 'READY'
  }
  const close = vi.fn()
  render(<OrderResourceAssignmentWizard orderId="o" onClose={close} />)
  const missionSteps = await screen.findByRole('region', { name: 'Nhiệm vụ' })
  expect(within(missionSteps).getAllByRole('listitem')).toHaveLength(3)
  expect(within(missionSteps).getByText('Giấy phép bay')).toBeInTheDocument()
  expect(within(missionSteps).queryByText('Thực hiện')).not.toBeInTheDocument()
  expect(within(missionSteps).queryByText('Hoàn tất')).not.toBeInTheDocument()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Hoàn tất phân công' }),
  )
  expect(close).toHaveBeenCalledTimes(1)
  expect(missionApi.assignResources).not.toHaveBeenCalled()
  expect(planningApi.finalizeExecutionPlan).not.toHaveBeenCalled()
})

it('partial siblings resume independently and Back from generic Staff returns to selection', async () => {
  missions[0].staffAssignments = crew('s1')
  missions[1].staffAssignments = crew('s2', 1)
  const view = render(
    <OrderResourceAssignmentWizard
      key="m1"
      orderId="o"
      initialMissionId="m1"
      onClose={vi.fn()}
    />,
  )
  await screen.findByLabelText('Chọn thiết bị')
  view.rerender(
    <OrderResourceAssignmentWizard
      key="generic"
      orderId="o"
      onClose={vi.fn()}
    />,
  )
  await enter('m2')
  expect(document.querySelectorAll('.odm-or-role-card.is-filled')).toHaveLength(
    1,
  )
  expect(screen.queryByText('Staff 1')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }))
  await screen.findByRole('region', { name: 'Chọn nhiệm vụ để phân công' })
  expect(missionApi.assignResources).not.toHaveBeenCalled()
})
it('mission-scoped entry cannot configure resources before plan finalization', async () => {
  plan.planStatus = 'DRAFT'
  render(
    <OrderResourceAssignmentWizard
      orderId="o"
      initialMissionId="m1"
      onClose={vi.fn()}
    />,
  )
  await screen.findByText(/Nhiệm vụ chưa đủ điều kiện phân công nguồn lực/)
  expect(
    screen.queryByLabelText('Chọn nhân sự cho Phi công'),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Mở kế hoạch Order' }),
  ).toHaveAttribute('href', '#portal/manager/orders/o')
})
