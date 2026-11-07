import { render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MissionsPage } from '../MissionsPage'
import { missionsApi } from '../../../api/missionsApi'
import type { MissionCalendarItem } from '../../../types/missions'

afterEach(() => vi.restoreAllMocks())
it('Mission menu has exact resume links and Order context but no duplicate planning block', async () => {
  const crew = ['PILOT', 'OPERATOR', 'MAINTAINER', 'INSPECTOR'].map(
    (assignedRole) => ({
      staffId: assignedRole,
      staffName: 'Nhân sự',
      assignedRole,
      responseStatus: 'PENDING',
    }),
  )
  vi.spyOn(missionsApi, 'listMissions').mockResolvedValue({
    items: [
      {
        id: 'm1',
        orderId: 'o',
        missionCode: 'M1',
        orderCode: 'ORD-1',
        status: 'PLANNING',
        staffAssignments: crew,
        droneId: null,
      },
      {
        id: 'm2',
        orderId: 'o',
        missionCode: 'M2',
        orderCode: 'ORD-1',
        status: 'READY',
        staffAssignments: crew,
        droneId: 'd2',
      },
    ] as MissionCalendarItem[],
  })
  render(<MissionsPage />)
  const row1 = (await screen.findByText('M1')).closest('tr')!
  const row2 = screen.getByText('M2').closest('tr')!
  expect(
    within(row1).getByRole('link', { name: 'Tiếp tục thiết lập' }),
  ).toHaveAttribute('href', '#portal/manager/missions/m1/setup')
  expect(
    within(row2).queryByRole('link', { name: 'Tiếp tục thiết lập' }),
  ).not.toBeInTheDocument()
  expect(within(row1).getByText('Chưa gán thiết bị')).toBeInTheDocument()
  expect(within(row2).getByText('Đã phân công nguồn lực')).toBeInTheDocument()
  expect(
    within(row1).getByRole('link', { name: 'Mở kế hoạch đơn hàng của M1' }),
  ).toHaveAttribute('href', '#portal/manager/orders/o')
  expect(
    screen.queryByText('Đơn đã duyệt — kế hoạch Mission'),
  ).not.toBeInTheDocument()
})

it('shows a red drone replacement request only for the current drone assignment', async () => {
  vi.spyOn(missionsApi, 'listMissions').mockResolvedValue({
    items: [
      {
        id: 'm-replaced',
        orderId: 'o',
        missionCode: 'MS-REPLACED',
        orderCode: 'ORD-1',
        status: 'READY',
        droneId: 'drone-new',
        deviceAssignments: [
          {
            id: 'old-assignment',
            deviceId: 'drone-old',
            deviceCode: 'DRN-OLD',
            deviceName: 'Old drone',
            deviceSerialNumber: null,
            deviceStatus: 'AVAILABLE',
            deviceRole: 'MAIN',
            checkupStatus: 'FAILED',
            assignedAt: '2026-10-01T08:00:00Z',
            replacementRequestedAt: '2026-10-01T09:00:00Z',
          },
          {
            id: 'current-assignment',
            deviceId: 'drone-new',
            deviceCode: 'DRN-NEW',
            deviceName: 'New drone',
            deviceSerialNumber: null,
            deviceStatus: 'AVAILABLE',
            deviceRole: 'MAIN',
            checkupStatus: 'PENDING',
            assignedAt: '2026-10-02T08:00:00Z',
            replacementRequestedAt: null,
          },
        ],
      },
      {
        id: 'm-requested',
        orderId: 'o',
        missionCode: 'MS-REQUESTED',
        orderCode: 'ORD-1',
        status: 'READY',
        droneId: 'drone-current',
        deviceAssignments: [
          {
            id: 'prior-assignment',
            deviceId: 'drone-old',
            deviceCode: 'DRN-OLD',
            deviceName: 'Old drone',
            deviceSerialNumber: null,
            deviceStatus: 'AVAILABLE',
            deviceRole: 'MAIN',
            checkupStatus: 'FAILED',
            assignedAt: '2026-10-01T08:00:00Z',
            replacementRequestedAt: '2026-10-01T09:00:00Z',
          },
          {
            id: 'current-request',
            deviceId: 'drone-current',
            deviceCode: 'DRN-CURRENT',
            deviceName: 'Current drone',
            deviceSerialNumber: null,
            deviceStatus: 'AVAILABLE',
            deviceRole: 'MAIN',
            checkupStatus: 'FAILED',
            assignedAt: '2026-10-02T08:00:00Z',
            replacementRequestedAt: '2026-10-02T09:00:00Z',
          },
        ],
      },
    ] as MissionCalendarItem[],
  })

  render(<MissionsPage />)

  const replacedRow = (await screen.findByText('MS-REPLACED')).closest('tr')!
  const requestedRow = screen.getByText('MS-REQUESTED').closest('tr')!
  expect(
    within(replacedRow).queryByText('Yêu cầu đổi drone'),
  ).not.toBeInTheDocument()
  expect(
    within(replacedRow).queryByText('Cần thanh toán tiền cọc'),
  ).not.toBeInTheDocument()

  const requestLabel = within(requestedRow).getByText('Yêu cầu đổi drone')
  expect(requestLabel.tagName).toBe('SMALL')
  expect(requestLabel).toHaveStyle({ color: 'var(--red-fg)' })
})
