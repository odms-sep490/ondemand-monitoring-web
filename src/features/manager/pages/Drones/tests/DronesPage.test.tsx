import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { droneApi } from '../../../../staff/api/droneApi'
import { missionsApi } from '../../../api/missionsApi'
import { DronesPage } from '../DronesPage'

vi.mock('../components/DroneRoomScene', () => ({
  DroneRoomScene: ({ label }: { label: string }) => (
    <div
      className="mgr-office-drone-scene-wrap"
      role="region"
      aria-label={label}
    />
  ),
}))

beforeEach(() => resetMockDb())
afterEach(() => {
  vi.restoreAllMocks()
  resetMockDb()
})

describe('DronesPage', () => {
  it('opens the 3D drone room by default', async () => {
    const { container } = render(<DronesPage />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Phòng drone 3D' }),
    ).toBeTruthy()
    await waitFor(() =>
      expect(
        container.querySelector('.mgr-office-drone-scene-wrap'),
      ).toBeTruthy(),
    )
  })

  it('shows loading state initially', () => {
    const { container } = render(<DronesPage />)
    const busy = container.querySelector('[aria-busy="true"]')
    const table = container.querySelector('table')
    expect(busy ?? table).toBeTruthy()
  })

  it('keeps the 3D room open and preselects the mission in the selected drone details', async () => {
    vi.spyOn(missionsApi, 'listMissions').mockResolvedValue({
      items: [
        {
          id: 'mission-1',
          missionCode: 'MS-1',
          orderCode: 'ORD-1',
          status: 'READY',
          scheduledStartAt: '2026-11-07T08:00:00Z',
          scheduledEndAt: '2026-11-07T09:00:00Z',
        },
        {
          id: 'mission-2',
          missionCode: 'MS-2',
          orderCode: 'ORD-2',
          status: 'READY',
          scheduledStartAt: '2026-11-08T08:00:00Z',
          scheduledEndAt: '2026-11-08T09:00:00Z',
        },
      ],
    } as never)
    vi.spyOn(droneApi, 'getAvailable').mockResolvedValue([
      { id: 'drone-1', label: 'Drone 1', status: 'AVAILABLE' },
    ])

    const { container } = render(<DronesPage assignmentMissionId="mission-2" />)

    await screen.findByRole('option', { name: /MS-2/ })
    expect(screen.getByLabelText('Nhiệm vụ')).toHaveValue('mission-2')
    await waitFor(() =>
      expect(
        container.querySelector('.mgr-office-drone-scene-wrap'),
      ).toBeTruthy(),
    )
    expect(container.querySelector('.mgr-drone-workspace-switcher')).toBeNull()
  })

  it('renders the English page title when language is switched', () => {
    render(<DronesPage />)
    act(() => setLanguage('en'))
    expect(
      screen.getByRole('heading', { level: 1, name: '3D drone room' }),
    ).toBeTruthy()
  })
})
