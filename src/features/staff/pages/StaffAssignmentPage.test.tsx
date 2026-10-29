import { act } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { StaffAssignmentPage } from './StaffAssignmentPage'

vi.mock('../../mission/api/missionApi', () => ({
  missionApi: {
    getPendingAssignmentMissions: vi.fn().mockResolvedValue([]),
    assignResources: vi.fn(),
  },
}))
vi.mock('../api/droneApi', () => ({
  droneApi: { getAvailable: vi.fn().mockResolvedValue([]) },
}))
vi.mock('../api/operatorApi', () => ({
  operatorApi: { getAvailable: vi.fn().mockResolvedValue([]) },
}))

describe('StaffAssignmentPage', () => {
  it('renders the Vietnamese title and empty state', async () => {
    render(<StaffAssignmentPage />)
    expect(
      await screen.findByText('Không có mission nào đang chờ phân công.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Phân công thiết bị và staff cho các mission vừa được duyệt.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Mission chờ phân công')).toBeInTheDocument()
  })

  it('renders the English title and empty state when language is switched', async () => {
    render(<StaffAssignmentPage />)
    await screen.findByText('Không có mission nào đang chờ phân công.')
    act(() => setLanguage('en'))
    expect(
      screen.getByText('No missions waiting for assignment.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Assign devices and staff to newly approved missions.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Pending Assignments')).toBeInTheDocument()
  })
})
