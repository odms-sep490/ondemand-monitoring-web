import { act } from 'react'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import { missionApi } from '../../../../mission/api/missionApi'
import type { Mission } from '../../../../mission/types/mission'
import { droneApi } from '../../../../staff/api/droneApi'
import { operatorApi } from '../../../../staff/api/operatorApi'
import { LiveDispatchPage } from '../LiveDispatchPage'

afterEach(() => vi.restoreAllMocks())

describe('LiveDispatchPage', () => {
  function clickLastStaffOption(name: RegExp) {
    const picker = screen
      .getByPlaceholderText('Tìm theo tên hoặc email...')
      .closest('div[style*="position: absolute"]')
    if (!picker) throw new Error('Staff picker is not open')
    fireEvent.click(within(picker as HTMLElement).getByRole('button', { name }))
  }

  it('assigns real device and 4 mission-role staff IDs to the selected mission', async () => {
    const mission = {
      id: 'mission-1',
      missionCode: 'MS-1',
      status: 'READY',
      orderTitle: 'Chụp ảnh',
      scheduledStartAt: '2026-10-10T03:00:00Z',
      scheduledEndAt: '2026-10-10T04:00:00Z',
    } as Mission
    vi.spyOn(missionApi, 'getMissionById').mockResolvedValue(mission)
    vi.spyOn(droneApi, 'getAvailable').mockResolvedValue([
      { id: 'drone-db-id', label: 'Drone 48' },
      { id: 'drone-db-id-2', label: 'Drone 49' },
    ])
    vi.spyOn(operatorApi, 'getAvailable').mockResolvedValue([
      { id: 'pilot-id', fullName: 'Pilot A', email: 'pilot@example.com' },
      {
        id: 'operator-id',
        fullName: 'Operator B',
        email: 'operator@example.com',
      },
      {
        id: 'maintainer-id',
        fullName: 'Maintainer C',
        email: 'maintainer@example.com',
      },
      {
        id: 'inspector-id',
        fullName: 'Inspector D',
        email: 'inspector@example.com',
      },
    ])
    const assign = vi
      .spyOn(missionApi, 'assignResources')
      .mockResolvedValue({ ...mission, status: 'READY' })

    render(<LiveDispatchPage missionId="mission-1" />)
    await waitFor(() => screen.getByRole('button', { name: 'Tiếp theo' }))

    fireEvent.click(screen.getByLabelText('Chọn nhân sự cho Phi công'))
    fireEvent.click(screen.getByRole('button', { name: /Pilot A/ }))
    fireEvent.click(screen.getByLabelText('Chọn nhân sự cho Vận hành'))
    fireEvent.click(screen.getByRole('button', { name: /Operator B/ }))
    fireEvent.click(screen.getByLabelText('Chọn nhân sự cho Bảo trì'))
    fireEvent.click(screen.getByRole('button', { name: /Maintainer C/ }))
    fireEvent.click(screen.getByLabelText('Chọn nhân sự cho Nghiệm thu'))
    fireEvent.click(screen.getByRole('button', { name: /Inspector D/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }))
    fireEvent.click(screen.getByLabelText('Chọn thiết bị'))
    fireEvent.click(screen.getByRole('option', { name: /Drone 48/ }))
    fireEvent.click(screen.getByRole('button', { name: /Thêm thiết bị/ }))
    fireEvent.click(screen.getByRole('option', { name: /Drone 49/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Phân công' }))
    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith(
        'mission-1',
        ['drone-db-id', 'drone-db-id-2'],
        {
          PILOT: ['pilot-id'],
          OPERATOR: ['operator-id'],
          MAINTAINER: ['maintainer-id'],
          INSPECTOR: ['inspector-id'],
        },
      ),
    )
  })

  it('allows one staff member to cover all 4 mission roles', async () => {
    const mission = {
      id: 'mission-1',
      missionCode: 'MS-1',
      status: 'READY',
      orderTitle: 'Chụp ảnh',
      scheduledStartAt: '2026-10-10T03:00:00Z',
      scheduledEndAt: '2026-10-10T04:00:00Z',
    } as Mission
    vi.spyOn(missionApi, 'getMissionById').mockResolvedValue(mission)
    vi.spyOn(droneApi, 'getAvailable').mockResolvedValue([
      { id: 'drone-db-id', label: 'Drone 48' },
    ])
    vi.spyOn(operatorApi, 'getAvailable').mockResolvedValue([
      {
        id: 'seed-staff-1',
        fullName: 'Seed Staff 1',
        email: 'seed@example.com',
      },
    ])
    const assign = vi
      .spyOn(missionApi, 'assignResources')
      .mockResolvedValue({ ...mission, status: 'READY' })

    render(<LiveDispatchPage missionId="mission-1" />)
    await waitFor(() => screen.getByRole('button', { name: 'Tiếp theo' }))

    fireEvent.click(screen.getByLabelText('Chọn nhân sự cho Phi công'))
    clickLastStaffOption(/Seed Staff 1/)
    fireEvent.click(screen.getByLabelText('Chọn nhân sự cho Vận hành'))
    clickLastStaffOption(/Seed Staff 1/)
    fireEvent.click(screen.getByLabelText('Chọn nhân sự cho Bảo trì'))
    clickLastStaffOption(/Seed Staff 1/)
    fireEvent.click(screen.getByLabelText('Chọn nhân sự cho Nghiệm thu'))
    clickLastStaffOption(/Seed Staff 1/)

    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }))
    fireEvent.click(screen.getByLabelText('Chọn thiết bị'))
    fireEvent.click(screen.getByRole('option', { name: /Drone 48/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Phân công' }))
    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('mission-1', ['drone-db-id'], {
        PILOT: ['seed-staff-1'],
        OPERATOR: ['seed-staff-1'],
        MAINTAINER: ['seed-staff-1'],
        INSPECTOR: ['seed-staff-1'],
      }),
    )
  })

  it('renders English labels when language is switched', async () => {
    const mission = {
      id: 'mission-1',
      missionCode: 'MS-1',
      status: 'READY',
      orderTitle: 'Chụp ảnh',
      scheduledStartAt: '2026-10-10T03:00:00Z',
      scheduledEndAt: '2026-10-10T04:00:00Z',
    } as Mission
    vi.spyOn(missionApi, 'getMissionById').mockResolvedValue(mission)
    vi.spyOn(droneApi, 'getAvailable').mockResolvedValue([
      { id: 'drone-db-id', label: 'Drone 48' },
    ])
    vi.spyOn(operatorApi, 'getAvailable').mockResolvedValue([
      { id: 'operator-db-id', fullName: 'Pilot A', email: 'pilot@example.com' },
    ])

    render(<LiveDispatchPage missionId="mission-1" />)
    act(() => setLanguage('en'))
    await waitFor(() => screen.getByRole('button', { name: 'Next' }))
    expect(
      screen.getByRole('heading', { name: 'Assign resources' }),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy()
  })
})
