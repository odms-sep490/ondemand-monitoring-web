import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { operatorApi } from '../../../api/operatorApi'
import { MissionListPage } from '../MissionListPage'

afterEach(() => vi.restoreAllMocks())

// No authenticated operator / mock server in this test: operatorApi.getProfile
// rejects immediately (no signed-in user), so the screen settles on its
// bilingual error state.
describe('MissionListPage', () => {
  it('renders the vietnamese error state', async () => {
    vi.spyOn(operatorApi, 'getProfile').mockRejectedValue(new Error('No session'))
    vi.spyOn(operatorApi, 'listMissions').mockRejectedValue(new Error('No session'))
    render(<MissionListPage searchQuery="" />)
    expect(
      await screen.findByText('Không tải được danh sách nhiệm vụ'),
    ).toBeTruthy()
    expect(screen.getByText('Thử lại')).toBeTruthy()
  })

  it('renders the english error state when language is switched', async () => {
    vi.spyOn(operatorApi, 'getProfile').mockRejectedValue(new Error('No session'))
    vi.spyOn(operatorApi, 'listMissions').mockRejectedValue(new Error('No session'))
    render(<MissionListPage searchQuery="" />)
    await screen.findByText('Không tải được danh sách nhiệm vụ')
    act(() => setLanguage('en'))
    expect(
      await screen.findByText('Could not load the mission list'),
    ).toBeTruthy()
    expect(screen.getByText('Retry')).toBeTruthy()
  })

  it('shows the latest backend status and action in the upcoming rail', async () => {
    vi.spyOn(operatorApi, 'getProfile').mockResolvedValue({
      id: 'staff-1',
      fullName: 'Seed Staff 1',
      email: 'seed@example.com',
      rank: '',
      station: '',
      certExpiry: '',
    })
    vi.spyOn(operatorApi, 'listMissions').mockResolvedValue({
      items: [
        {
          id: 'mission-1',
          missionCode: 'MS-35806',
          backendStatus: 'PREFLIGHT_CHECKING',
          status: 'ACCEPTED',
          title: 'Drone inspection',
          location: 'Cần Giuộc, Tây Ninh',
          date: '2026-10-06',
          startTime: '08:16',
          endTime: '08:20',
          serviceLabel: 'Drone test',
          droneCode: 'DRN-0054',
          droneName: null,
          permissions: {
            canControlFlight: true,
            canOperatePayload: true,
            canInspectDevice: true,
            canMaintainDevice: true,
            canUploadMedia: true,
          },
        },
      ],
    })

    render(<MissionListPage searchQuery="" />)

    expect(await screen.findByText('Đang precheck')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Precheck' })).toBeTruthy()
    expect(screen.queryByText('Đã nhận')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Xem kết quả' })).toBeNull()
  })
})
