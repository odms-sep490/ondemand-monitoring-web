import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { MissionQualityPanel } from './MissionQualityPanel'
import { apiRequest } from '../../../shared/api/httpClient'
import { missionApi } from '../../mission/api/missionApi'
vi.mock('../../../shared/api/httpClient', () => ({ apiRequest: vi.fn() }))
vi.mock('../../mission/api/missionApi', () => ({
  missionApi: {
    getPermissions: vi.fn(),
    getMissionResult: vi.fn().mockResolvedValue(null),
    getMissionMedia: vi.fn().mockResolvedValue([]),
  },
}))
vi.mock('./ImageQualityPanel', () => ({ ImageQualityPanel: ({ mediaId }: { mediaId: string }) => <div>Chi tiết {mediaId}</div> }))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(missionApi.getPermissions).mockResolvedValue({ canReviewMissionMedia: true } as never)
  vi.mocked(missionApi.getMissionResult).mockResolvedValue(null)
  vi.mocked(missionApi.getMissionMedia).mockResolvedValue([])
})
it('shows actual batch counts and opens existing image quality detail', async () => {
  vi.mocked(apiRequest).mockResolvedValue([
    { media_id: 'one', file_name: 'Ảnh nét', status: 'COMPLETED', decision: 'PASS' },
    { media_id: 'two', file_name: 'Ảnh chờ' },
  ])
  render(<MissionQualityPanel missionId="mission" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Mở kiểm duyệt' }))
  expect(await screen.findByText(/Tổng ảnh: 2/)).toBeInTheDocument()
  fireEvent.click(screen.getAllByRole('button', { name: 'Xem và duyệt' })[0])
  expect(screen.getByText('Chi tiết one')).toBeInTheDocument()
})
it('shows authorization error without inventing gallery statuses', async () => {
  vi.mocked(apiRequest).mockRejectedValue(new Error('Forbidden'))
  render(<MissionQualityPanel missionId="mission" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Mở kiểm duyệt' }))
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Xem và duyệt' })).not.toBeInTheDocument()
})
