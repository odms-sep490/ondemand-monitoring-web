import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import type { MissionCalendarItem } from '../../../types/missions'
import { schedulePageMessages } from '../SchedulePage.messages'
import { MissionEventBlock } from '../components/MissionEventBlock'

const start = new Date()
start.setHours(9, 0, 0, 0)
const end = new Date(start.getTime() + 60 * 60_000)

const mission = {
  id: 'm1',
  orderId: 'o1',
  orderCode: 'ORD-77',
  missionCode: 'MSN-HOVER-1',
  status: 'SCHEDULED',
  scheduledStartAt: start.toISOString(),
  scheduledEndAt: end.toISOString(),
  serviceLabel: 'Kiểm tra mái',
  droneCode: 'DRN-42',
  droneName: null,
  operatorName: 'Nguyễn Phi Công',
} as unknown as MissionCalendarItem

describe('MissionEventBlock hover card', () => {
  it('shows details on hover and navigates from the button', async () => {
    const onSelect = vi.fn()
    render(
      <MissionEventBlock
        mission={mission}
        start={start}
        end={end}
        selected={false}
        statusLabel="Đã lên lịch"
        touch={false}
        lang="vi"
        t={schedulePageMessages.vi}
        onSelect={onSelect}
      />,
    )
    const block = await screen.findByRole('button', { name: /MSN-HOVER-1/ })
    expect(screen.queryByText('Nguyễn Phi Công')).toBeNull()
    fireEvent.mouseEnter(block)
    expect(await screen.findByText('Nguyễn Phi Công')).toBeTruthy()
    expect(screen.getByText('Nguyễn Phi Công')).toBeTruthy()
    expect(screen.getByText('ORD-77')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết' }))
    expect(onSelect).toHaveBeenCalledWith(mission)
  })
})
