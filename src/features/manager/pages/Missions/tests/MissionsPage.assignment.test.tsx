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
        status: 'RESOURCE_ASSIGNING',
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
    within(row1).getByRole('link', { name: 'Mở kế hoạch Order của M1' }),
  ).toHaveAttribute('href', '#portal/manager/orders/o')
  expect(
    screen.queryByText('Đơn đã duyệt — kế hoạch Mission'),
  ).not.toBeInTheDocument()
})
